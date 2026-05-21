# 命运之轮 - 手势控制卡牌交互系统

基于 MediaPipe 手势识别的「答案之书」风格卡牌抽取小游戏。

## 功能特性

- **手势识别**：张开手掌浏览、食指指向锁定、捏合确认选择
- **级联拖尾动画**：中心卡响应快，边缘卡滞后，形成涟漪流动效果
- **Faux-3D 透视**：skewX 倾斜模拟旋转木马透视感
- **弧形运动轨迹**：Y 偏移模拟球面曲率
- **临界阻尼弹簧**：无过冲、无振荡，精准平滑到位
- **粒子特效背景**：Canvas 星光粒子系统
- **鼠标回退模式**：无摄像头时自动切换鼠标/触摸操作

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- [MediaPipe Hand Landmarker](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- Canvas 2D 粒子系统

## 快速开始

1. 克隆仓库
```bash
git clone https://github.com/dadi829/gesture-control-card-draw.git
cd gesture-control-card-draw
```

2. 启动本地服务器
```bash
python -m http.server 3000
```

3. 打开浏览器访问 http://localhost:3000

## 手势操作

| 手势 | 功能 |
|------|------|
| 🖐 张开手掌 | 左右移动浏览卡牌 |
| ☝ 食指指向 | 锁定当前卡牌 |
| 🤏 捏合手指 | 确认选择并翻牌 |

## 项目结构

```
├── index.html          # 主页面
├── css/
│   └── main.css        # 样式文件
├── js/
│   ├── main.js         # 主逻辑模块
│   ├── cards.js        # 卡牌系统
│   └── particles.js    # 粒子系统
└── data/
    └── answers.js      # 答案文案数据库
```

## 浏览器兼容性

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

需要支持 WebRTC 和 ES6 Modules。

## License

MIT
