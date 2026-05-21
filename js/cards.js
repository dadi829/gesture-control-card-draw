/**
 * 卡牌系统 — 手势驱动的级联拖尾走马灯
 * 核心动画特性：级联拖尾、非线性缩放、Faux-3D透视、临界阻尼弹簧、弧形路径
 */

class CardSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.cards = [];
    this.carousel = null;
    this.track = null;
    this.totalCards = 20;
    this.cardSpacing = 170;
    this.scrollOffset = 0;
    this.targetOffset = 0;
    this.scrollVelocity = 0;
    this.springStiffness = 0.045;
    this.springDamping = 0.90;
    this.lastTime = 0;
    this.scrollActive = false;
    this.SCROLL_SENSITIVITY = 0.55;
    this.ARC_HEIGHT = 0.22;
    this.ARC_CURVE_POWER = 2.2;
    this.TRAIL_CENTER_RESPONSE = 0.42;
    this.TRAIL_EDGE_LAG = 0.06;
    this.MAX_SKEW_DEG = 18;
    this.edgeDriftStart = 0;
    this.edgeDriftDirection = 0;
    this.EDGE_DRIFT_DELAY = 400;
    this.EDGE_DRIFT_SPEED = 0.5;
    this.EDGE_ZONE_FRACTION = 0.12;
    this.highlightedIndex = -1;
    this._prevClosestCard = -1;
    this.flippedIndex = -1;
    this.isAnimating = false;
    this.frozen = false;
    this.onCardSelected = null;
    this.onCenterCardChange = null;
    this._createCarousel();
  }

  _createCarousel() {
    this.carousel = document.createElement('div');
    this.carousel.className = 'card-carousel';
    this.container.appendChild(this.carousel);
    this.track = document.createElement('div');
    this.track.className = 'card-track';
    this.carousel.appendChild(this.track);
  }

  init(cardData) {
    if (!this.container) return;
    this.cards = cardData.map(d => ({ ...d }));
    this.highlightedIndex = -1;
    this._prevClosestCard = -1;
    this.flippedIndex = -1;
    this.isAnimating = false;
    this.frozen = false;
    this.edgeDriftStart = 0;
    this.edgeDriftDirection = 0;
    this.render();
    const ww = window.innerWidth;
    const midIndex = Math.floor(this.cards.length / 2);
    this.scrollOffset = (ww / 2) - midIndex * this.cardSpacing - 65;
    this.targetOffset = this.scrollOffset;
    this.scrollVelocity = 0;
    requestAnimationFrame(() => this.applyScroll());
  }

  render() {
    this.track.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.dataset.index = i;
      const inner = document.createElement('div');
      inner.className = 'card-inner';
      const front = document.createElement('div');
      front.className = 'card-face card-front';
      front.innerHTML = '<div class="card-front-design"><div class="card-symbol-area"><div class="card-symbol">\u2726</div></div><div class="card-stars"><span class="star star-tl">\u2726</span><span class="star star-tr">\u2726</span><span class="star star-bl">\u2726</span><span class="star star-br">\u2726</span></div><div class="card-number">' + (i + 1) + '</div><div class="card-border-inner"></div></div>';
      const back = document.createElement('div');
      back.className = 'card-face card-back';
      const categoryMap = {};
      if (window.ANSWERS_DATA && window.ANSWERS_DATA.categories) {
        for (const cat of window.ANSWERS_DATA.categories) categoryMap[cat.id] = cat;
      }
      const category = categoryMap[card.category];
      const catColor = category ? category.color : '#c8a84e';
      const catIcon = category ? category.icon : '?';
      const catName = category ? category.name : '未知';
      back.innerHTML = '<div class="card-back-design"><div class="card-category" style="color:' + catColor + '">' + catIcon + ' ' + catName + '</div><div class="card-title">' + card.title + '</div><div class="card-content">' + card.content + '</div><div class="card-advice">“' + card.advice + '”</div></div>';
      inner.appendChild(front);
      inner.appendChild(back);
      wrapper.appendChild(inner);
      fragment.appendChild(wrapper);
      card._element = wrapper;
      card._inner = inner;
      card._front = front;
      card._back = back;
      card._trailOffset = 0;
    }
    this.track.appendChild(fragment);
    this._updateCardSpacing();
  }

  _updateCardSpacing() {
    const ww = window.innerWidth;
    this.cardSpacing = ww < 480 ? 85 : ww < 768 ? 100 : ww < 1024 ? 115 : 130;
    this._layoutCards();
  }

  _layoutCards() {
    const cardWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-width').trim()) || 130;
    this.trackWidth = (this.totalCards - 1) * this.cardSpacing + cardWidth;
    this.track.style.width = this.trackWidth + 'px';
    this.track.style.height = '100%';
    for (let i = 0; i < this.cards.length; i++) {
      const el = this.cards[i]._element;
      if (!el) continue;
      el.style.left = (i * this.cardSpacing) + 'px';
      el.style.top = '50%';
    }
  }

  _getTrailFactor(distFromCenter) {
    const t = Math.min(1, distFromCenter / 6);
    return this.TRAIL_CENTER_RESPONSE + (this.TRAIL_EDGE_LAG - this.TRAIL_CENTER_RESPONSE) * t;
  }

  _easeOutScale(distFromCenter) {
    const maxScale = 1.08;
    const minScale = 0.55;
    const range = maxScale - minScale;
    const t = Math.min(1, distFromCenter / 7);
    const eased = 1 - Math.pow(1 - t, 3);
    return maxScale - eased * range;
  }

  _easeOutOpacity(distFromCenter) {
    const t = Math.min(1, distFromCenter / 5);
    const eased = 1 - Math.pow(1 - t, 2);
    return Math.max(0.25, 1 - eased * 0.85);
  }

  setScrollByHand(handScreenX) {
    if (this.frozen || this.isAnimating) return;
    const ww = window.innerWidth;
    const normalizedX = Math.max(0, Math.min(1, handScreenX / ww));
    const centerIndex = (this.totalCards - 1) / 2;
    const mappedIndex = centerIndex + (normalizedX - 0.5) * (this.totalCards - 1) * this.SCROLL_SENSITIVITY;
    this._lastHandX = normalizedX;
    const edgeZone = this.EDGE_ZONE_FRACTION;
    let newEdgeDir = 0;
    if (normalizedX < edgeZone) newEdgeDir = -1;
    else if (normalizedX > 1 - edgeZone) newEdgeDir = 1;
    if (newEdgeDir !== 0) {
      if (this.edgeDriftDirection === newEdgeDir) {
        if (Date.now() - this.edgeDriftStart > this.EDGE_DRIFT_DELAY) {
          const driftExtra = (Date.now() - this.edgeDriftStart - this.EDGE_DRIFT_DELAY) / 1000 * this.EDGE_DRIFT_SPEED * 60;
          const extraCards = driftExtra * this.SCROLL_SENSITIVITY;
          const driftedIndex = mappedIndex + newEdgeDir * extraCards;
          const clampedIndex = Math.max(0, Math.min(this.totalCards - 1, driftedIndex));
          this.targetOffset = (ww / 2) - clampedIndex * this.cardSpacing - 65;
        } else {
          this.targetOffset = (ww / 2) - mappedIndex * this.cardSpacing - 65;
        }
      } else {
        this.edgeDriftDirection = newEdgeDir;
        this.edgeDriftStart = Date.now();
        this.targetOffset = (ww / 2) - mappedIndex * this.cardSpacing - 65;
      }
    } else {
      this.edgeDriftDirection = 0;
      this.edgeDriftStart = 0;
      this.targetOffset = (ww / 2) - mappedIndex * this.cardSpacing - 65;
    }
    if (!this.scrollActive) {
      this.scrollActive = true;
      this.lastTime = performance.now();
      this._startScrollLoop();
    }
  }

  releaseHand() { this.targetOffset = this.scrollOffset; }

  freeze() {
    this.frozen = true;
    this.edgeDriftDirection = 0;
    this.edgeDriftStart = 0;
    const closest = this._getClosestCardIndex();
    if (closest >= 0) {
      const ww = window.innerWidth;
      this.targetOffset = (ww / 2) - closest * this.cardSpacing - 65;
    }
  }

  unfreeze() { this.frozen = false; }

  _getClosestCardIndex() {
    const centerX = window.innerWidth / 2;
    let closest = -1;
    let minDist = Infinity;
    for (let i = 0; i < this.cards.length; i++) {
      const el = this.cards[i]._element;
      if (!el) continue;
      const cardLeft = parseFloat(el.style.left) || (i * this.cardSpacing);
      const cardCenter = cardLeft + 65 + this.scrollOffset;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    return closest;
  }

  _startScrollLoop() {
    const loop = (now) => {
      if (!this.scrollActive) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      if (!this.frozen) {
        const force = (this.targetOffset - this.scrollOffset) * this.springStiffness;
        this.scrollVelocity += force;
        this.scrollVelocity *= this.springDamping;
        this.scrollOffset += this.scrollVelocity;
        const ww = window.innerWidth;
        const minOffset = (ww / 2) - (this.totalCards - 1) * this.cardSpacing - 65;
        const maxOffset = (ww / 2) - 65;
        const margin = this.cardSpacing * 0.5;
        if (this.scrollOffset < minOffset - margin) {
          this.scrollOffset += (minOffset - margin - this.scrollOffset) * 0.15;
        } else if (this.scrollOffset > maxOffset + margin) {
          this.scrollOffset += (maxOffset + margin - this.scrollOffset) * 0.15;
        }
        if (Math.abs(this.scrollVelocity) < 0.15 && Math.abs(this.targetOffset - this.scrollOffset) < 0.5) {
          this.scrollOffset = this.targetOffset;
          this.scrollVelocity = 0;
          this.scrollActive = false;
        }
      } else {
        const force = (this.targetOffset - this.scrollOffset) * 0.12;
        this.scrollVelocity += force;
        this.scrollVelocity *= 0.65;
        this.scrollOffset += this.scrollVelocity;
        if (Math.abs(this.scrollVelocity) < 0.05 && Math.abs(this.targetOffset - this.scrollOffset) < 0.3) {
          this.scrollOffset = this.targetOffset;
          this.scrollVelocity = 0;
          this.scrollActive = false;
        }
      }
      this.applyScroll();
      if (this.scrollActive) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  applyScroll() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const centerX = ww / 2;
    const arcMaxY = wh * this.ARC_HEIGHT;
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const el = card._element;
      if (!el) continue;
      const cardLeft = parseFloat(el.style.left) || (i * this.cardSpacing);
      const cardCenter = cardLeft + 65;
      const screenX = cardCenter + this.scrollOffset;
      const distFromCenter = Math.abs(screenX - centerX) / this.cardSpacing;
      const side = screenX > centerX ? -1 : 1;
      const trailFactor = this._getTrailFactor(distFromCenter);
      if (card._trailOffset === undefined) card._trailOffset = this.scrollOffset;
      card._trailOffset += (this.scrollOffset - card._trailOffset) * trailFactor;
      const trailScreenX = cardCenter + card._trailOffset;
      const trailDist = Math.abs(trailScreenX - centerX) / this.cardSpacing;
      const trailSide = trailScreenX > centerX ? -1 : 1;
      const scale = this._easeOutScale(trailDist);
      const opacity = this._easeOutOpacity(trailDist);
      const zIndex = Math.round(100 - trailDist * 80);
      const arcFactor = Math.pow(trailDist / 8, this.ARC_CURVE_POWER);
      const yOffset = Math.min(arcMaxY, arcFactor * arcMaxY * 3);
      const skewAmount = Math.min(1, trailDist / 5) * this.MAX_SKEW_DEG * trailSide;
      const skewStr = ' skewX(' + skewAmount.toFixed(1) + 'deg)';
      el.style.transform = 'translate(-50%, calc(-50% + ' + yOffset.toFixed(1) + 'px)) scale(' + scale.toFixed(3) + ')' + skewStr;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = zIndex;
    }
    this.track.style.transform = 'translateY(-50%) translateX(' + (this.scrollOffset | 0) + 'px)';
    const closest = this._getClosestCardIndex();
    if (closest !== this._prevClosestCard) {
      this._prevClosestCard = closest;
      if (this.onCenterCardChange && closest >= 0) this.onCenterCardChange(this.cards[closest]);
      this._updateHighlight(closest);
    }
  }

  _updateHighlight(closestIndex) {
    this.highlightedIndex = closestIndex;
    for (let i = 0; i < this.cards.length; i++) {
      const el = this.cards[i]._element;
      if (!el) continue;
      el.classList.toggle('highlighted', i === closestIndex);
      el.classList.toggle('dimmed', closestIndex >= 0 && i !== closestIndex);
    }
  }

  confirmCard(index) {
    if (this.isAnimating) return;
    if (index < 0 || index >= this.cards.length) return;
    this.isAnimating = true;
    this.frozen = true;
    this.frozenIndex = index;
    this.edgeDriftDirection = 0;
    this.edgeDriftStart = 0;
    const card = this.cards[index];
    const el = card._element;
    const inner = card._inner;
    el.classList.add('confirmed');
    const currentTransform = el.style.transform || '';
    const translateMatch = currentTransform.match(/translate\([^)]+\)/);
    const baseTranslate = translateMatch ? translateMatch[0] : 'translate(-50%, -50%)';
    el.style.transform = baseTranslate + ' scale(1.15)';
    el.style.zIndex = '200';
    for (let i = 0; i < this.cards.length; i++) {
      if (i !== index && this.cards[i]._element) this.cards[i]._element.classList.add('fade-out');
    }
    setTimeout(() => {
      inner.classList.add('flipped');
      setTimeout(() => {
        if (this.onCardSelected) this.onCardSelected(card);
        this.isAnimating = false;
      }, 900);
    }, 500);
  }

  flipCard(index) { this.confirmCard(index); }

  clearHighlight() {
    this.highlightedIndex = -1;
    this._prevClosestCard = -1;
    this.frozen = false;
    this.scrollActive = true;
    this.lastTime = performance.now();
    this._startScrollLoop();
  }

  handleResize() {
    for (const card of this.cards) card._trailOffset = this.scrollOffset;
    this._updateCardSpacing();
    this.applyScroll();
  }

  reset() {
    this.scrollActive = false;
    this.isAnimating = false;
    this.frozen = false;
    this.highlightedIndex = -1;
    this._prevClosestCard = -1;
    this.flippedIndex = -1;
    this.edgeDriftDirection = 0;
    this.edgeDriftStart = 0;
    this.scrollOffset = 0;
    this.targetOffset = 0;
    this.scrollVelocity = 0;
    this.track.innerHTML = '';
  }
}

window.CardSystem = CardSystem;
