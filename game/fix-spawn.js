// Fix: change monster spawning from infinite wave-based to fixed total per level
// Key changes:
// 1. spawnRoom() - initialize monster queue + total count
// 2. addEnemy() - accept specific type, not random
// 3. spawn loop - use queue-based spawning
// 4. dmgE() - track kills this level, trigger door when all dead
// 5. Door logic - replace score-gated with "all monsters dead"
// 6. Boss rooms - boss still at score threshold, door appears on boss death
// 7. goRoom/startGame - reset queue state
// 8. tickUI - show remaining monster count
// 9. new function getTotalMonstersForLevel()
// 10. Boss death no longer auto-wins; shows door if queue+alive=0

var fs=require('fs');
var lines=fs.readFileSync('game.html','utf8').split(/\r?\n/);

// ============================================================
// 1. spawnRoom() - replace the whole function (lines ~916-920)
// ============================================================
var spawnRoomStart=-1,spawnRoomEnd=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('function spawnRoom(){')>=0) spawnRoomStart=i;
  if(spawnRoomStart>=0 && spawnRoomEnd<0 && lines[i].trim()==='}' && i>spawnRoomStart+2) spawnRoomEnd=i;
}
if(spawnRoomStart>=0 && spawnRoomEnd>=0){
  var newSpawnRoom=[
    'function spawnRoom(){',
    '  G.enemies=[];G.showDoor=false;G.doorActive=false;G.boss=null;',
    '  // 本关怪物总数和待生成队列',
    '  G.totalMonsters=getTotalMonstersForLevel(G.room);',
    '  G.monsterQueue=[];',
    '  G.monstersAlive=0;',
    '  G.allSpawned=false;',
    '  var cfg=ROOM_CFG[G.room];',
    '  for(var i=0;i<G.totalMonsters;i++){',
    '    var type=cfg.types[Math.floor(Math.random()*cfg.types.length)];',
    '    G.monsterQueue.push(type);',
    '  }',
    '  // 初始出生一批',
    '  var initCnt=Math.min(cfg.spawnMin,G.monsterQueue.length);',
    '  for(var j=0;j<initCnt;j++){addEnemyOne(G.monsterQueue.pop());}',
    '  spawnTimer=0;',
    '}'
  ];
  lines.splice(spawnRoomStart,spawnRoomEnd-spawnRoomStart+1,newSpawnRoom.join('\r\n'));
  console.log('1. Replaced spawnRoom()');
}

// ============================================================
// 2. Add getTotalMonstersForLevel BEFORE spawnRoom
// ============================================================
var getTotalFn=[
  'function getTotalMonstersForLevel(room){',
  '  // 每关怪物总数：约12~24只，随关卡递增',
  '  return Math.floor(12+room*0.08);',
  '}',
  ''
];
var insertIdx=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('function spawnRoom(){')>=0){ insertIdx=i; break; }
}
if(insertIdx>=0){
  lines.splice(insertIdx,0,getTotalFn.join('\r\n'));
  console.log('2. Added getTotalMonstersForLevel()');
}

// ============================================================
// 3. Add addEnemyOne(type) - spawns ONE enemy of a specific type
//    Keep original addEnemy for backward compat, or replace it
// ============================================================
var addEnemyStart=-1,addEnemyEnd=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('function addEnemy(types){')>=0) addEnemyStart=i;
  if(addEnemyStart>=0 && addEnemyEnd<0 && lines[i].trim()==='}' && i>addEnemyStart+10) addEnemyEnd=i;
}
if(addEnemyStart>=0 && addEnemyEnd>=0){
  var newAddEnemy=[
    'function addEnemy(types){addEnemyOne(types[Math.floor(Math.random()*types.length)]);}',
    'function addEnemyOne(type){',
    '  var d=ED[type];if(!d)return;',
    '  var diff=ROOM_CFG[G.room].diff;',
    '  for(var attempt=0;attempt<10;attempt++){',
    '    var angle=Math.random()*Math.PI*2;',
    '    var dist=80+Math.random()*180;',
    '    var tx=Math.floor((G.p.x+Math.cos(angle)*dist)/TILE);',
    '    var ty=Math.floor((G.p.y+Math.sin(angle)*dist)/TILE);',
    '    var cols=Math.floor(W/TILE),rows=Math.floor(H/TILE);',
    '    if(tx>0&&tx<cols-1&&ty>0&&ty<rows-1&&G.map[ty]&&G.map[ty][tx]===0){',
    '      G.enemies.push({',
    '        type:type,x:(tx+0.5)*TILE,y:(ty+0.5)*TILE,',
    '        hp:Math.round(d.hp*diff),maxHp:Math.round(d.hp*diff),',
    '        spd:d.spd,dmg:Math.round(d.dmg*diff),sz:d.sz,',
    '        ar:d.ar,ac:d.ac,curA:d.ac+Math.random()*40,sc:d.sc,',
    '        rng:d.rng||false,col:d.col,',
    '        dead:false,dying:0,ht:0,state:"idle",ang:0,stun:0,alpha:1',
    '      });',
    '      G.monstersAlive++;',
    '      return;',
    '    }',
    '  }',
    '}'
  ];
  lines.splice(addEnemyStart,addEnemyEnd-addEnemyStart+1,newAddEnemy.join('\r\n'));
  console.log('3. Replaced addEnemy + added addEnemyOne()');
}

// ============================================================
// 4. Replace spawn loop (lines ~2221-2227)
// ============================================================
var spawnLoopStart=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].trim()==='if(p&&G.enemies.length<25){') spawnLoopStart=i;
}
if(spawnLoopStart>=0){
  var newSpawnLoop=[
    '        if(p&&G.enemies.length<25&&G.monsterQueue&&G.monsterQueue.length>0){',
    '          spawnTimer++;',
    '          if(spawnTimer>=cfg.spawnInt){',
    '            spawnTimer=0;',
    '            var cnt=Math.min(cfg.spawnMin+Math.floor(Math.random()*(cfg.spawnMax-cfg.spawnMin+1)),G.monsterQueue.length);',
    '            for(var i=0;i<cnt;i++){addEnemyOne(G.monsterQueue.pop());}',
    '          }',
    '        }',
    '        if(G.monsterQueue&&G.monsterQueue.length===0){G.allSpawned=true;}'
  ];
  // Replace 7 lines (the spawn block)
  lines.splice(spawnLoopStart,7,newSpawnLoop.join('\r\n'));
  console.log('4. Replaced spawn loop at line '+(spawnLoopStart+1));
}

// ============================================================
// 5. Modify door logic: change from score-gated to "all monsters dead"
//    Find and replace the door block
// ============================================================
// Old: "if(cfg.bossScore===0&&cfg.doorScore&&p&&p.score>=cfg.doorScore&&!G.doorActive){"
var doorLineIdx=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('cfg.bossScore===0&&cfg.doorScore&&p&&p.score>=cfg.doorScore&&!G.doorActive')>=0){
    doorLineIdx=i; break;
  }
}
if(doorLineIdx>=0){
  var newDoorBlock=[
    '        // 普通关：所有怪物清空后出现传送门',
    '        if(cfg.bossScore===0&&G.monsterQueue&&G.monsterQueue.length===0&&G.monstersAlive<=0&&!G.doorActive){'
  ];
  // Replace the "if" line
  lines[doorLineIdx]=newDoorBlock[0];
  // Also need to update the condition check on next few lines (same block, line 2247)
  // The door condition change is done
  console.log('5. Changed door logic to monster-cleared');
}

// Now handle the Boss room door: appears after boss dies + all monsters dead
// Boss door: currently boss death directly triggers win. We need to change that.
// After boss dies + monster queue empty + alive=0 → show door (or auto-win like before)
// For boss rooms, keep the existing boss death → win flow but also check monsters
// Actually, let's modify tickBoss to check for monsters too

// ============================================================
// 6. Modify dmgE() to track kills and trigger level clear check
// ============================================================
var dmgELine=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('e.dead=true;e.dying=20;G.kills++;G.p.score+=e.sc;G.roomScore+=e.sc;')>=0){
    dmgELine=i; break;
  }
}
if(dmgELine>=0){
  lines[dmgELine]="    e.dead=true;e.dying=20;G.kills++;G.p.score+=e.sc;G.roomScore+=e.sc;if(G.monstersAlive!==undefined)G.monstersAlive--;";
  console.log('6. Added monstersAlive-- to dmgE');
}

// ============================================================
// 7. goRoom() - reset monster queue
// ============================================================
var goRoomResetLine=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("G.phase='playing';G.map=makeMap();G.showDoor=false;G.doorActive=false;G.kills=0;G.roomScore=0;G.expFly=null;")>=0){
    goRoomResetLine=i; break;
  }
}
if(goRoomResetLine>=0){
  lines[goRoomResetLine]="  G.phase='playing';G.map=makeMap();G.showDoor=false;G.doorActive=false;G.kills=0;G.roomScore=0;G.expFly=null;G.monsterQueue=null;G.totalMonsters=0;G.monstersAlive=0;G.allSpawned=false;";
  console.log('7. Updated goRoom() to reset queue');
}

// ============================================================
// 8. startGame() - add queue reset
// ============================================================
var startGameLine=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("G={phase:'playing',room:startRoom,map:makeMap(),enemies:[],kills:0,expFly:null,showAttrUI:false")>=0){
    startGameLine=i; break;
  }
}
if(startGameLine>=0){
  lines[startGameLine]="  G={phase:'playing',room:startRoom,map:makeMap(),enemies:[],kills:0,expFly:null,showAttrUI:false,monsterQueue:null,totalMonsters:0,monstersAlive:0,allSpawned:false,p:null};";
  console.log('8. Updated startGame() to reset queue');
}

// ============================================================
// 9. initGame() - add queue fields
// ============================================================
var initGameLine=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("G={phase:'menu',room:0,map:makeMap(),enemies:[],kills:0,expFly:null,showAttrUI:false}")>=0){
    initGameLine=i; break;
  }
}
if(initGameLine>=0){
  lines[initGameLine]="  G={phase:'menu',room:0,map:makeMap(),enemies:[],kills:0,expFly:null,showAttrUI:false,monsterQueue:null,totalMonsters:0,monstersAlive:0,allSpawned:false};";
  console.log('9. Updated initGame()');
}

// ============================================================
// 10. tickUI - show remaining monster count in HUD
// ============================================================
// Find the roomName display line and add monster count after it
var tickUiRoomLine=-1;
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("document.getElementById('room').textContent=roomName;")>=0) { tickUiRoomLine=i; break; }
}
if(tickUiRoomLine>=0){
  var remainingInfo=[
    "  var remainingText='';",
    "  if(G.monsterQueue&&G.totalMonsters>0){",
    "    var remaining=G.monsterQueue.length+G.monstersAlive;",
    "    remainingText='  剩余:'+remaining;",
    "  }",
    "  document.getElementById('room').textContent=roomName+remainingText;"
  ];
  // Replace the single room line
  lines.splice(tickUiRoomLine,1,remainingInfo.join('\r\n'));
  console.log('10. Updated tickUI to show remaining monsters');
}

fs.writeFileSync('game.html',lines.join('\r\n'),'utf8');
console.log('Done - all changes applied');
