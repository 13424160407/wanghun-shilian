# 关卡增长配置（153关完整版）

## 1️⃣ 回合与关卡结构

51回合 × 3关 = 153关

| 回合 | 关卡范围 | Boss关 |
|------|---------|-------|
| 第1回合 | 第1-3关 | 第3关 |
| 第2回合 | 第4-6关 | 第6关 |
| ... | ... | ... |
| 第51回合 | 第151-153关 | 第153关 |

**关卡索引**：代码中 room 从 0 开始，room N 对应第 N+1 关。

## 2️⃣ 武器属性增长（公式）

### 剑（Sword）
```
dmg = 10 + room * 1.8
rng = 2.0 + room * 0.015
cd  = Math.max(2, 8 - Math.floor(room / 25))
```

### 弓（Bow）
```
dmg = 8 + room * 1.6
rng = 8 + room * 0.08
cd  = Math.max(3, 12 - Math.floor(room / 20))
spd = Math.min(30, 12 + Math.floor(room / 8))
```

### 盾（Shield）
```
dmg = 5 + room * 1.8
rng = 2.0 + room * 0.015
cd  = Math.max(4, 15 - Math.floor(room / 18))
```

## 3️⃣ 怪物属性

怪物基础属性保持不变（共13种），每个关房的 `diff` 系数缩放实际属性。

## 4️⃣ 房间配置（生成规则）

| 属性 | 增长公式（room = 0~152） |
|------|------------------------|
| 难度系数 `diff` | `1.0 + room * 0.035`（范围 1.0 ~ 6.32） |
| 开门分数 `doorScore` | `300 + room * 25`（Boss关×1.8） |
| 生成间隔 `spawnInt` | `Math.max(35, 120 - room * 0.55)` |
| 生成数量下限 | `Math.min(8, 2 + Math.floor(room / 35))` |
| 生成数量上限 | `Math.min(12, 4 + Math.floor(room / 20))` |
| Boss触发分数 | Boss关时 = doorScore × 1.2 |

## 5️⃣ Boss配置（每3回合循环3种外观）

Boss 外观循环：boss01 → boss02 → boss03 → boss01 → ...

### Boss属性缩放

```
cycle = Math.floor(room / 3)       // 第几个3关组 (0~50)
scale = 1 + cycle * 0.2            // 每轮+20%

hp      = baseHp * scale
dmg     = baseDmg * scale
cd      = Math.max(25, baseCd / scale)
spd     = baseSpd + cycle * 0.08
bullets = Math.min(30, baseBullets + floor(cycle * 0.2))
sz      = Math.min(3.5, baseSz + cycle * 0.015)
```

**Boss基础属性**：

| Boss | HP | CD | 大小 | 伤害 | 速度 | 弹幕数 |
|------|----|----|------|------|------|--------|
| boss01 | 1300 | 108 | 2.0 | 15 | 3.8 | 8 |
| boss02 | 3300 | 80 | 2.2 | 18 | 4.2 | 10 |
| boss03 | 8600 | 60 | 2.5 | 22 | 4.8 | 12 |

## 6️⃣ 难度系数影响

**公式**：`怪物实际属性 = 基础属性 × room_diff`

**示例（骷髅兵，基础HP=80，基础伤害=12）**：

| 房间 | 关卡 | diff | 实际HP | 实际伤害 |
|------|------|------|--------|---------|
| 0 | 第1关 | 1.00 | 80 | 12 |
| 50 | 第51关 | 2.75 | 220 | 33 |
| 100 | 第101关 | 4.50 | 360 | 54 |
| 152 | 第153关 | 6.32 | 506 | 76 |

## 7️⃣ 批量更新配置

不要手动编辑 `game-config.json`，运行：

```bash
node generate-config.js
```

这会重新生成全部 153 关的配置（武器、房间、Boss、成长数据）。

调整生成参数请编辑 `generate-config.js`：
- 修改 `TOTAL_ROOMS` 更改总关卡数
- 修改武器/房间/Boss的生成公式
- 修改 `ENEMY_POOLS` 调整不同阶段的敌人组成
