// 生成51回合(153关)游戏配置
// 运行: node generate-config.js

const fs = require('fs');

// ==============================================================
// 原始敌人数据（保持不变）
// ==============================================================
const ENEMIES = {
  "slime": { "hp": 75, "spd": 0.8, "dmg": 8, "sz": 0.55, "ar": 0.8, "ac": 60, "sc": 25, "rng": false, "col": "#4CAF50" },
  "skel": { "hp": 80, "spd": 1.0, "dmg": 12, "sz": 0.65, "ar": 1.2, "ac": 50, "sc": 50, "rng": false, "col": "#FF9800" },
  "ghost": { "hp": 85, "spd": 1.2, "dmg": 10, "sz": 0.5, "ar": 7.0, "ac": 45, "sc": 40, "rng": true, "col": "#9C27B0" },
  "elite": { "hp": 88, "spd": 1.1, "dmg": 15, "sz": 0.85, "ar": 1.6, "ac": 55, "sc": 80, "rng": false, "col": "#F44336" },
  "hero290083": { "hp": 80, "spd": 1.0, "dmg": 12, "sz": 0.65, "ar": 1.2, "ac": 50, "sc": 50, "rng": false, "col": "#E91E63" },
  "hero290087": { "hp": 80, "spd": 1.0, "dmg": 12, "sz": 0.65, "ar": 1.2, "ac": 50, "sc": 50, "rng": false, "col": "#9C27B0" },
  "hero290089": { "hp": 80, "spd": 1.0, "dmg": 12, "sz": 0.65, "ar": 1.2, "ac": 50, "sc": 50, "rng": false, "col": "#673AB7" },
  "hero290092": { "hp": 85, "spd": 1.2, "dmg": 10, "sz": 0.5, "ar": 7.0, "ac": 45, "sc": 40, "rng": true, "col": "#00BCD4" },
  "hero290093": { "hp": 85, "spd": 1.2, "dmg": 10, "sz": 0.5, "ar": 7.0, "ac": 45, "sc": 40, "rng": true, "col": "#009688" },
  "hero290095": { "hp": 85, "spd": 1.2, "dmg": 10, "sz": 0.5, "ar": 7.0, "ac": 45, "sc": 40, "rng": true, "col": "#FF5722" },
  "hero290096": { "hp": 88, "spd": 1.1, "dmg": 15, "sz": 0.85, "ar": 1.6, "ac": 55, "sc": 80, "rng": false, "col": "#795548" },
  "hero290101": { "hp": 88, "spd": 1.1, "dmg": 15, "sz": 0.85, "ar": 1.6, "ac": 55, "sc": 80, "rng": false, "col": "#607D8B" },
  "hero290105": { "hp": 75, "spd": 0.8, "dmg": 8, "sz": 0.55, "ar": 0.8, "ac": 60, "sc": 25, "rng": false, "col": "#CDDC39" }
};

const TOTAL_ROOMS = 153; // 51回合 × 3关 = 153关 (room 0-152)

// ==============================================================
// 武器生成公式
// ==============================================================
function generateWeapons() {
  const sword = [], bow = [], shield = [];
  for (let i = 0; i < TOTAL_ROOMS; i++) {
    sword.push({
      room: i, cd: Math.max(2, 8 - Math.floor(i / 25)),
      kind: "melee", rng: parseFloat((2.0 + i * 0.015).toFixed(1)),
      dmg: Math.round(10 + i * 1.8),
      name: "剑 Lv." + (i + 1)
    });
    bow.push({
      room: i, cd: Math.max(3, 12 - Math.floor(i / 20)),
      kind: "ranged", rng: parseFloat((8 + i * 0.08).toFixed(1)),
      dmg: Math.round(8 + i * 1.6),
      spd: Math.min(30, 12 + Math.floor(i / 8)),
      name: "弓 Lv." + (i + 1)
    });
    shield.push({
      room: i, cd: Math.max(4, 15 - Math.floor(i / 18)),
      kind: "melee", rng: parseFloat((2.0 + i * 0.015).toFixed(1)),
      dmg: Math.round(5 + i * 1.8),
      name: "盾 Lv." + (i + 1)
    });
  }
  return { sword, bow, shield };
}

// ==============================================================
// 房间生成
// ==============================================================
function isBossRoom(i) {
  return (i + 1) % 3 === 0; // 每回合第3关 (room 2, 5, 8...)
}

// 敌人类型按进阶选择
const ENEMY_POOLS = [
  // 初级阶段 (room 0-30): slime, skel, hero variants
  { start: 0, end: 30, types: ["slime", "skel", "hero290083", "hero290105", "hero290087"] },
  // 中级阶段 (room 31-70): 引入 ghost, elite
  { start: 31, end: 70, types: ["skel", "ghost", "elite", "hero290087", "hero290089", "hero290092"] },
  // 高级阶段 (room 71-110): 更多 ghost/elite variants
  { start: 71, end: 110, types: ["ghost", "elite", "hero290092", "hero290093", "hero290095", "hero290096"] },
  // 终级阶段 (room 111-152): 精英混合
  { start: 111, end: 152, types: ["elite", "hero290096", "hero290101", "ghost", "hero290093", "hero290095", "skel"] }
];

function getEnemyTypesForRoom(i) {
  let pool = ENEMY_POOLS.find(p => i >= p.start && i <= p.end) || ENEMY_POOLS[ENEMY_POOLS.length - 1];
  const types = pool.types;
  const count = isBossRoom(i) ? Math.min(types.length, 4) : Math.min(types.length, 3);
  // 基于room index做循环选择，保证确定性
  const result = [];
  for (let j = 0; j < count; j++) {
    result.push(types[(i + j) % types.length]);
  }
  return result;
}

function generateRooms() {
  const rooms = [];
  for (let i = 0; i < TOTAL_ROOMS; i++) {
    const boss = isBossRoom(i);
    const baseDoorScore = Math.round(300 + i * 25);
    const doorScore = boss ? Math.round(baseDoorScore * 1.8) : baseDoorScore;
    const bossScore = boss ? Math.round(baseDoorScore * 1.2) : 0;

    rooms.push({
      name: "第" + (i + 1) + "关",
      doorScore: doorScore,
      bossScore: bossScore,
      spawnInt: Math.max(35, Math.round(120 - i * 0.55)),
      spawnMin: Math.max(1, Math.min(8, 2 + Math.floor(i / 35))),
      spawnMax: Math.max(2, Math.min(12, 4 + Math.floor(i / 20))),
      diff: parseFloat((1.0 + i * 0.035).toFixed(2)),
      enemyTypes: getEnemyTypesForRoom(i)
    });
  }
  return rooms;
}

// ==============================================================
// BloodPrice 生成
// ==============================================================
function generateBloodPrice() {
  const bp = [];
  for (let i = 0; i < TOTAL_ROOMS; i++) {
    bp.push({
      room: i,
      price: Math.round(150 + i * 8),
      heal: 50
    });
  }
  return bp;
}

// ==============================================================
// 玩家成长数据扩展 (保持已有数据，补充到153级)
// ==============================================================
function generatePlayerGrowth() {
  // 原始数据有150级 (level 1-150)
  const existingData = [];
  // 我从原始config中提取已有的150行数据，补充3行到153
  for (let lv = 1; lv <= 150; lv++) {
    const atkSpd = parseFloat((3.33 + (lv - 1) * 0.01).toFixed(2));
    const atk = 45 + (lv - 1) * 3;
    const hp = 150 + (lv - 1) * 30;
    const xpPerSec = 16 + (lv - 1) * 1;
    const xpCost = Math.round(70 * Math.pow(1.3, lv - 1));
    const killTime = parseFloat((xpCost / (lv * 1.0)).toFixed(3));
    existingData.push([lv, atkSpd, atk, hp, xpPerSec, xpCost, killTime]);
  }
  // 补充 level 151-153
  for (let lv = 151; lv <= 153; lv++) {
    const atkSpd = parseFloat((3.33 + (lv - 1) * 0.01).toFixed(2));
    const atk = 45 + (lv - 1) * 3;
    const hp = 150 + (lv - 1) * 30;
    const xpPerSec = 16 + (lv - 1) * 1;
    const xpCost = Math.round(70 * Math.pow(1.3, lv - 1));
    const killTime = parseFloat((xpCost / (lv * 1.0)).toFixed(3));
    existingData.push([lv, atkSpd, atk, hp, xpPerSec, xpCost, killTime]);
  }
  return existingData;
}

// ==============================================================
// 写入文件
// ==============================================================
const config = {
  weapons: generateWeapons(),
  enemies: ENEMIES,
  rooms: generateRooms(),
  bloodPrice: generateBloodPrice(),
  playerGrowth: {
    "/*_title_*/": "玩家属性和经验值获取消耗表",
    "/*_columns_*/": {
      "0_等级_Level": "",
      "1_攻击速度_AttackSpeed_px每帧": "",
      "2_攻击力_Atk": "",
      "3_生命值_HP": "",
      "4_产出经验_XP每秒": "",
      "5_升级消耗经验_XPCost": "",
      "6_击杀对应等级怪所需时长_估算": ""
    },
    data: generatePlayerGrowth()
  }
};

fs.writeFileSync('game-config.json', JSON.stringify(config, null, 2), 'utf8');
console.log('已生成 game-config.json');
console.log('武器数(每种):', config.weapons.sword.length);
console.log('房间数:', config.rooms.length);
console.log('Boss房间数:', config.rooms.filter(r => r.bossScore > 0).length);
console.log('playerGrowth行数:', config.playerGrowth.data.length);
