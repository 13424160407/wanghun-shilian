# 购买复活功能 - BUG修复说明

## 已修复的问题

### 问题1：购买按钮无法点击
**原因：** HTML中购买按钮图片的`pointer-events:none`阻止了点击事件穿透

**修复：**
- 将购买01按钮的`pointer-events`改为`auto`
- 添加`z-index:100`确保按钮在最上方
- 添加`cursor:pointer`提示可点击
- 设置初始`display:none`，由JS控制显示

### 问题2：图标飞行不显示
**原因：** 
- 起始位置获取不准确（span元素太小或invisible）
- 坐标转换逻辑错误

**修复：**
- 改进`startIconFlies()`逻辑，分别处理不同类型的图标源
- 优化`animateIconFlyCommon()`：
  - 使用固定50x50px的飞行元素
  - 正确计算贝塞尔曲线的起点和终点中心
  - 添加淡出效果（opacity逐渐降低）

## 测试步骤

### 1. 打开浏览器F12开发者工具
- 按`F12`打开控制台
- 切换到`Console`标签页

### 2. 启动游戏并测试购买功能

#### 场景A：积分不足（验证不可购买UI）
```javascript
// 在控制台执行
G.p.score = 100;  // 设置积分为100（第1关需要150）
G.p.hp = 0;       // 让玩家HP为0触发死亡
```
预期结果：
- ✅ 死亡页面显示 `icon_goumai02`（不可购买按钮）
- ✅ 显示 `yebz` 提示
- ✅ 文本显示 "当前积分：100"
- ✅ 控制台输出 "显示购买02"

#### 场景B：积分充足（验证购买流程）
```javascript
// 在控制台执行
G.p.score = 200;  // 设置积分为200（≥第1关150）
G.p.hp = 0;       // 让玩家HP为0触发死亡
```
预期结果：
- ✅ 死亡页面显示 `icon_goumai01`（可购买按钮）
- ✅ 不显示 `yebz`
- ✅ 文本显示 "本次消耗积分：150"
- ✅ 控制台输出 "显示购买按钮"
- ✅ 点击购买按钮后：
  - 控制台输出 "购买按钮被点击"
  - 积分：200 → 50（扣除150）
  - 血量恢复
  - 药瓶数+1
  - 出现 3个图标飞行动画
  - 控制台输出飞行日志
  - 1秒后进入第1关

### 3. 关键控制台日志检查清单

点击购买按钮时应该看到以下日志顺序：
```
购买按钮被点击
购买流程开始
当前房间 0 血量售价 {room: 0, price: 150, heal: 50}
购买成功！积分: 200 → 50
已恢复血量、扣积分、增加药瓶，开始飞行动画
开始图标飞行
从死亡框飞行: dead-icon-xueliang → pot
从文字图标飞行: dead-icon-kill → kills
从文字图标飞行: dead-icon-score → score
飞行参数 {from: "dead-icon-xueliang", to: "pot", ...}
飞行参数 {from: "dead-icon-kill", to: "kills", ...}
飞行参数 {from: "dead-icon-score", to: "score", ...}
[600ms后]
飞行完成，移除
飞行完成，移除
飞行完成，移除
1秒后进入游戏
```

### 4. 如果仍有问题，检查以下内容

**检查购买按钮是否被找到：**
```javascript
console.log(document.querySelector('.dead-icon-goumai01'));
```
应该返回img元素，不是null

**检查目标元素是否存在：**
```javascript
console.log(document.getElementById('kills'));
console.log(document.getElementById('score'));
console.log(document.getElementById('pot'));
```
应该都返回元素

**检查配置是否加载：**
```javascript
console.log(GAME_CONFIG.bloodPrice);
```
应该显示10个房间的血量配置

**手动触发购买流程（如果button无反应）：**
```javascript
onBuyBlood();  // 直接调用购买函数
```

## 代码修改摘要

### game-config.json
- 添加`bloodPrice`数组，10个房间配置

### game.html

| 函数 | 改动 |
|------|------|
| `setupDeadPageBuyButton()` | 添加日志、避免重复绑定 |
| `updateDeadPageBuyUI()` | 添加详细日志用于调试 |
| `onBuyBlood()` | 添加关键步骤日志 |
| `startIconFlies()` | 重写，分离死亡框图标和文字图标处理 |
| `animateIconFlyFromDead()` | 新增，处理死亡框内图标 |
| `animateIconFlyFromIcon()` | 新增，处理文字图标 |
| `animateIconFlyCommon()` | 新增，通用飞行动画逻辑 |

### HTML改动
- `icon_goumai01`: 改`pointer-events:none` → `auto`，添加`z-index:100`，初始`display:none`
- `icon_goumai02`: 初始`display:none`
- `icon_yebz`: 初始`display:none`

## 常见问题排查

**Q: 购买按钮点击无效**
A: 打开控制台看是否有错误，检查是否`G.p`存在

**Q: 图标不飞行或飞错位置**
A: 检查控制台是否输出飞行日志，查看fromRect和toRect坐标是否合理

**Q: 飞行后游戏没有继续**
A: 检查`goRoom()`是否被调用，确认`getRoundStartRoom()`返回正确的房间号

## 反馈

如有其他问题，请：
1. 截图或录屏
2. 提供控制台完整日志
3. 说明具体步骤和预期结果
