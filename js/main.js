/**
 * 命运之轮 — 主逻辑模块
 * MediaPipe 手势识别 + 卡牌弧形走马灯滑动
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class App {
  constructor() {
    this.cameraPip = document.getElementById('camera-pip');
    this.webcam = document.getElementById('webcam');
    this.handCanvas = document.getElementById('hand-canvas');
    this.handCtx = null;
    this.handCursor = document.getElementById('hand-cursor');
    this.statusText = document.getElementById('status-text');
    this.resultOverlay = document.getElementById('result-overlay');
    this.loader = document.getElementById('loader');
    this.hintPoint = document.getElementById('hint-point');
    this.hintPinch = document.getElementById('hint-pinch');
    this.hintOpen = document.getElementById('hint-open');
    this.state = 'loading';
    this.handLandmarker = null;
    this.lastVideoTime = -1;
    this.cursorX = -100;
    this.cursorY = -100;
    this.smoothX = -100;
    this.smoothY = -100;
    this.pinchStartTime = 0;
    this.selectConfirmed = false;
    this.confirmedCardIndex = -1;
    this.openHandStartTime = 0;
    this.previewCardIndex = -1;
    this.frameCounter = 0;
    this.INFERENCE_INTERVAL = 3;
    this.lastResults = null;
    this.lastGestureState = '';
    this._categoryMap = null;
    this.openHandFrameCount = 0;
    this.OPEN_HAND_THRESHOLD = 10;
    this.pinchFrameCount = 0;
    this.PINCH_THRESHOLD = 6;
    this.pinchCooldownUntil = 0;
    this.particles = null;
    this.cardSystem = null;
    this.init();
  }

  async init() {
    const initStart = performance.now();
    this._categoryMap = {};
    if (window.ANSWERS_DATA) {
      for (const cat of window.ANSWERS_DATA.categories) this._categoryMap[cat.id] = cat;
    }
    this.particles = new window.ParticleSystem('particle-canvas');
    this.cardSystem = new window.CardSystem('card-area');
    this.cardSystem.onCardSelected = (card) => this._showResult(card);
    const initialCards = window.ANSWERS_DATA.drawCards(20);
    this.cardSystem.init(initialCards);
    const t0 = performance.now();
    const cameraPromise = this._setupCamera();
    const mediapipePromise = this._setupMediaPipe();
    await Promise.all([cameraPromise, mediapipePromise]);
    window.addEventListener('resize', () => { if (this.cardSystem) this.cardSystem.handleResize(); });
    if (this.loader) this.loader.classList.add('hidden');
    this.state = 'browsing';
    this._setStatus('张开手掌左右移动浏览卡牌');
    this._startTracking();
    console.log('[Perf] Init: ' + (performance.now() - initStart).toFixed(0) + 'ms');
  }

  _setStatus(text) { if (this.statusText) this.statusText.textContent = text; }

  async _setupCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }, audio: false });
      this.webcam.srcObject = stream;
      await this.webcam.play();
      const rect = this.cameraPip.getBoundingClientRect();
      this.handCanvas.width = rect.width;
      this.handCanvas.height = rect.height;
      this.handCtx = this.handCanvas.getContext('2d');
    } catch (err) {
      console.warn('摄像头不可用，回退到鼠标模式', err);
      this._setupMouseFallback();
    }
  }

  async _setupMediaPipe() {
    try {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
      });
    } catch (err) {
      console.warn('MediaPipe 加载失败，回退到鼠标模式', err);
      this.handLandmarker = null;
      this._setupMouseFallback();
    }
  }

  _setupMouseFallback() {
    this._setStatus('移动鼠标浏览卡牌，悬停锁定，点击确认');
    this.hintOpen.textContent = '手 移动浏览';
    this.hintPoint.textContent = '手 悬停锁定';
    this.hintPinch.textContent = '手 点击确认';
    if (this.loader) this.loader.classList.add('hidden');
    this.state = 'browsing';
    document.addEventListener('mousemove', (e) => {
      if (this.state !== 'browsing' && this.state !== 'preview') return;
      this._updateCursorPos(e.clientX, e.clientY);
      if (this.state === 'browsing') this.cardSystem.setScrollByHand(this.smoothX);
    });
    let hoverTimer = null;
    document.addEventListener('mousemove', () => {
      if (this.state === 'browsing') {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          if (this.state === 'browsing') {
            this.state = 'preview';
            this.cardSystem.freeze();
            this._setStatus('悬停锁定中，点击确认选择');
            this._updateHintState('point');
          }
        }, 600);
      }
    });
    document.addEventListener('click', () => {
      if (this.state === 'preview') {
        this.state = 'confirming';
        const idx = this.cardSystem._getClosestCardIndex();
        if (idx >= 0) this._confirmSelection(idx);
      } else if (this.state === 'result') {
        this._restartGame();
      }
    });
  }

  _startTracking() {
    const predictWebcam = () => {
      if (!this.webcam || !this.handLandmarker) { requestAnimationFrame(predictWebcam); return; }
      this.frameCounter++;
      const shouldInfer = this.frameCounter % this.INFERENCE_INTERVAL === 0;
      if (shouldInfer && this.webcam.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.webcam.currentTime;
        const results = this.handLandmarker.detectForVideo(this.webcam, Date.now());
        this._processHandResults(results);
        this.lastResults = results;
      } else if (this.lastResults) {
        this._updateCursorOnly();
      }
      requestAnimationFrame(predictWebcam);
    };
    requestAnimationFrame(predictWebcam);
  }

  _updateCursorOnly() {
    if (!this.lastResults?.landmarks?.length) return;
    if (this.state === 'flipping' || this.state === 'result') return;
    const indexTip = this.lastResults.landmarks[0][8];
    const screenX = (1 - indexTip.x) * window.innerWidth;
    const screenY = indexTip.y * window.innerHeight;
    this.smoothX = this.smoothX < 0 ? screenX : this.smoothX + 0.22 * (screenX - this.smoothX);
    this.smoothY = this.smoothY < 0 ? screenY : this.smoothY + 0.22 * (screenY - this.smoothY);
    this.cursorX = screenX;
    this.cursorY = screenY;
    this.handCursor.style.left = this.smoothX + 'px';
    this.handCursor.style.top = this.smoothY + 'px';
    if (this.state === 'browsing') this.cardSystem.setScrollByHand(this.smoothX);
  }

  _processHandResults(results) {
    if (!this.handCtx) return;
    this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
    if (!results.landmarks || results.landmarks.length === 0) {
      this.handCursor.classList.remove('visible');
      this._resetHintStates();
      this.openHandFrameCount = Math.max(0, this.openHandFrameCount - 1);
      return;
    }
    const landmarks = results.landmarks[0];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    this._drawHandLandmarks(landmarks);
    const indexExtended = indexTip.y < landmarks[6].y;
    const middleExtended = middleTip.y < landmarks[10].y;
    const ringExtended = ringTip.y < landmarks[14].y;
    const pinkyExtended = pinkyTip.y < landmarks[18].y;
    const screenX = (1 - indexTip.x) * window.innerWidth;
    const screenY = indexTip.y * window.innerHeight;
    this.smoothX = this.smoothX < 0 ? screenX : this.smoothX + 0.28 * (screenX - this.smoothX);
    this.smoothY = this.smoothY < 0 ? screenY : this.smoothY + 0.28 * (screenY - this.smoothY);
    this.cursorX = screenX;
    this.cursorY = screenY;
    this.handCursor.style.left = this.smoothX + 'px';
    this.handCursor.style.top = this.smoothY + 'px';
    this.handCursor.classList.add('visible');
    const allFingersExtended = indexExtended && middleExtended && ringExtended && pinkyExtended;
    const pointGesture = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    const pinchGesture = this._isPinching(landmarks);
    if (this.state === 'result') {
      if (allFingersExtended) {
        if (!this.openHandStartTime) this.openHandStartTime = Date.now();
        if (Date.now() - this.openHandStartTime > 1200) { this._restartGame(); this.openHandStartTime = 0; }
      } else { this.openHandStartTime = 0; }
      return;
    }
    if (this.state === 'flipping') return;
    if (pinchGesture) {
      this.handCursor.classList.add('pinching');
      this._updateHintState('pinch');
      this.openHandFrameCount = 0;
      if (this.state === 'confirming') {
        if (this.pinchStartTime && Date.now() - this.pinchStartTime > 800 && !this.selectConfirmed) {
          this.selectConfirmed = true;
          const idx = this.confirmedCardIndex >= 0 ? this.confirmedCardIndex : this.cardSystem._getClosestCardIndex();
          this._confirmSelection(idx);
        }
        return;
      }
      if (Date.now() < this.pinchCooldownUntil) { this.pinchFrameCount = 0; return; }
      if (this.state === 'browsing' || this.state === 'preview') {
        this.pinchFrameCount++;
        if (this.pinchFrameCount >= this.PINCH_THRESHOLD && !this.pinchStartTime) {
          this.pinchStartTime = Date.now();
          this.state = 'confirming';
          this.cardSystem.freeze();
          this.confirmedCardIndex = this.cardSystem._getClosestCardIndex();
          this._setStatus('保持捏合...确认选择中...');
        }
      }
      return;
    }
    this.pinchFrameCount = Math.max(0, this.pinchFrameCount - 1);
    if (this.state === 'confirming') {
      this.state = 'browsing';
      this.cardSystem.unfreeze();
      this.pinchCooldownUntil = Date.now() + 350;
      this.pinchStartTime = 0;
      this.selectConfirmed = false;
      this._setStatus('张开手掌左右移动浏览卡牌');
    }
    this.pinchStartTime = 0;
    if (pointGesture) {
      this.handCursor.classList.remove('pinching');
      this.openHandFrameCount = 0;
      if (this.state !== 'preview') {
        this.state = 'preview';
        this.cardSystem.freeze();
        this.previewCardIndex = this.cardSystem._getClosestCardIndex();
        this._setStatus('卡牌已锁定，捏合手指确认选择');
        this._updateHintState('point');
      }
      return;
    }
    if (allFingersExtended) {
      this.handCursor.classList.remove('pinching');
      this.openHandFrameCount++;
      if (this.openHandFrameCount >= this.OPEN_HAND_THRESHOLD) {
        if (this.state !== 'browsing') {
          this.state = 'browsing';
          this.cardSystem.unfreeze();
          this._setStatus('张开手掌左右移动浏览卡牌');
          this._updateHintState('open');
        }
        this.cardSystem.setScrollByHand(this.smoothX);
      }
      return;
    }
    this.openHandFrameCount = Math.max(0, this.openHandFrameCount - 1);
    this._resetHintStates();
  }

  _updateCursorPos(x, y) {
    this.cursorX = x; this.cursorY = y;
    this.smoothX = x; this.smoothY = y;
    this.handCursor.style.left = x + 'px';
    this.handCursor.style.top = y + 'px';
    this.handCursor.classList.add('visible');
  }

  _isPinching(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const dx = thumb.x - index.x;
    const dy = thumb.y - index.y;
    const dz = (thumb.z || 0) - (index.z || 0);
    return (dx * dx + dy * dy + dz * dz) < 0.004;
  }

  _drawHandLandmarks(landmarks) {
    if (!this.handCtx) return;
    const w = this.handCanvas.width;
    const h = this.handCanvas.height;
    const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    this.handCtx.strokeStyle = 'rgba(200, 168, 78, 0.5)';
    this.handCtx.lineWidth = 1;
    for (const [i, j] of connections) {
      this.handCtx.beginPath();
      this.handCtx.moveTo(landmarks[i].x * w, landmarks[i].y * h);
      this.handCtx.lineTo(landmarks[j].x * w, landmarks[j].y * h);
      this.handCtx.stroke();
    }
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);
      this.handCtx.beginPath();
      this.handCtx.arc(lm.x * w, lm.y * h, isTip ? 3 : 1.5, 0, Math.PI * 2);
      this.handCtx.fillStyle = isTip ? '#f0d878' : 'rgba(200,168,78,0.6)';
      this.handCtx.fill();
    }
  }

  _confirmSelection(index) {
    if (index < 0) return;
    this.state = 'flipping';
    this._setStatus('命运之卡已选中！');
    this.statusText.classList.add('confirmed');
    this._resetHintStates();
    if (this.particles) this.particles.burst(this.smoothX, this.smoothY, 40);
    this.cardSystem.flipCard(index);
  }

  _showResult(card) {
    this.state = 'result';
    this.handCursor.classList.remove('visible', 'pinching');
    const category = this._categoryMap[card.category];
    const resultInner = document.querySelector('#result-card .result-card-inner');
    resultInner.innerHTML = '<span class="result-category" style="color:' + (category ? category.color : '#c8a84e') + '">' + (category ? category.icon : '?') + ' ' + (category ? category.name : '命运') + '</span><div class="result-title">' + card.title + '</div><div class="result-divider"></div><div class="result-content">' + card.content + '</div><div class="result-advice"><span class="advice-label">给你的启示</span>"' + card.advice + '"</div>';
    setTimeout(() => {
      this.resultOverlay.classList.add('visible');
      if (this.particles) {
        const rRect = document.getElementById('result-card').getBoundingClientRect();
        this.particles.burst(rRect.left + rRect.width / 2, rRect.top + rRect.height / 2, 30);
      }
    }, 400);
  }

  _restartGame() {
    this.state = 'browsing';
    this.selectConfirmed = false;
    this.confirmedCardIndex = -1;
    this.pinchStartTime = 0;
    this.openHandStartTime = 0;
    this.openHandFrameCount = 0;
    this.pinchFrameCount = 0;
    this.pinchCooldownUntil = 0;
    this.previewCardIndex = -1;
    this.lastGestureState = '';
    this.smoothX = -100;
    this.smoothY = -100;
    this.resultOverlay.classList.remove('visible');
    this._setStatus('张开手掌左右移动浏览卡牌');
    this.statusText.classList.remove('confirmed');
    setTimeout(() => {
      this.cardSystem.reset();
      const cards = window.ANSWERS_DATA.drawCards(20);
      this.cardSystem.init(cards);
      this.cardSystem.unfreeze();
      if (this.particles) this.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 20);
    }, 500);
  }

  _updateHintState(gesture) {
    if (gesture === this.lastGestureState) return;
    this.lastGestureState = gesture;
    this.hintOpen.classList.toggle('active', gesture === 'open');
    this.hintPoint.classList.toggle('active', gesture === 'point');
    this.hintPinch.classList.toggle('active', gesture === 'pinch');
  }

  _resetHintStates() {
    if (this.lastGestureState === '') return;
    this.lastGestureState = '';
    this.hintOpen.classList.remove('active');
    this.hintPoint.classList.remove('active');
    this.hintPinch.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });
