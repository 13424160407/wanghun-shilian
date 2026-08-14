// Knockback + miss animation rewrite
// Bidirectional resonance: player gets knocked back playing miss anim, enemies get knocked back playing miss anim

var fs=require('fs');
var html=fs.readFileSync('game.html','utf8');

// ============================================================
// 1. mkPlayer() — add missAnimT, knockVx, knockVy
// ============================================================
html=html.replace(
  "l:1,expAccum:0,expTotal:0,",
  "l:1,expAccum:0,expTotal:0,missAnimT:0,knockVx:0,knockVy:0,"
);

// ============================================================
// 2. hurtP — add source coords, miss state + knockback
// ============================================================
var oldHurtP='function hurtP(dmg){\n  var p=G.p;if(!p||p.invT>0||p.roll)return;\n  p.hp-=dmg;p.hurtT=15;p.invT=45;p.state=\'hit\';';
var newHurtP='function hurtP(dmg,sx,sy){\n  var p=G.p;if(!p||p.invT>0||p.roll)return;\n  p.hp-=dmg;p.hurtT=15;p.invT=45;p.state=\'miss\';p.missAnimT=45;\n  // 计算击退方向(从攻击者指向玩家)\n  if(typeof sx===\'number\'&&typeof sy===\'number\'){\n    var _hdx=p.x-sx,_hdy=p.y-sy;\n    var _hdist=Math.hypot(_hdx,_hdy)||1;\n    p.knockVx=_hdx/_hdist*20;p.knockVy=_hdy/_hdist*20;\n  }\n  var _msp=SPRITES[\'player_miss\'];if(_msp)_msp.frame=0;';
html=html.replace(oldHurtP,newHurtP);

// ============================================================
// 3. tickPlayer — add missAnimT + knockback decay
// ============================================================
var oldTickState='  if(p.wpnCd>0)p.wpnCd--;\n}';
var newTickState='  if(p.wpnCd>0)p.wpnCd--;\n  if(p.missAnimT>0)p.missAnimT--;\n  // 击退衰减\n  if(Math.abs(p.knockVx)>0.1||Math.abs(p.knockVy)>0.1){\n    p.x+=p.knockVx;p.y+=p.knockVy;\n    p.knockVx*=0.82;p.knockVy*=0.82;\n    if(Math.abs(p.knockVx)<0.2)p.knockVx=0;\n    if(Math.abs(p.knockVy)<0.2)p.knockVy=0;\n  }\n}';
html=html.replace(oldTickState,newTickState);

// ============================================================
// 4. Player draw — missAnimT overrides sprite to player_miss
// ============================================================
var oldPlayerSprite='  if(p){\n    // ▶ 精灵选择 & 翻转\n    // 所有精灵除了 player_right 都原生朝左; player_right 原生朝右\n    var pSpriteName=\'player_\'+p.state;\n    if(p.state===\'idle\'&&(Math.abs(p.vx)>0.1||Math.abs(p.vy)>0.1)){\n      pSpriteName=\'player_right\';\n    }';
var newPlayerSprite='  if(p){\n    // ▶ 精灵选择 & 翻转(受击击退动画优先)\n    var pSpriteName;\n    if(p.missAnimT>0){\n      pSpriteName=\'player_miss\';\n    }else{\n      pSpriteName=\'player_\'+p.state;\n      if(p.state===\'idle\'&&(Math.abs(p.vx)>0.1||Math.abs(p.vy)>0.1)){\n        pSpriteName=\'player_right\';\n      }\n    }';
html=html.replace(oldPlayerSprite,newPlayerSprite);

// ============================================================
// 5. dmgE — add miss state + knockback, pass player coords
// ============================================================
var oldDmgE='function dmgE(e,dmg){\n  if(e.dead)return;\n  e.hp-=dmg;e.ht=8;e.state=\'hit\';';
var newDmgE='function dmgE(e,dmg){\n  if(e.dead||e.missAnimT>0)return;\n  e.hp-=dmg;e.ht=0;e.state=\'miss\';e.missAnimT=54;\n  // 从玩家方向击退\n  if(G.p){\n    var _edx=e.x-G.p.x,_edy=e.y-G.p.y;\n    var _edist=Math.hypot(_edx,_edy)||1;\n    e.x+=_edx/_edist*24;e.y+=_edy/_edist*24;\n  }\n  var _esp=SPRITES[e.type+\'_miss\'];if(_esp)_esp.frame=0;';
html=html.replace(oldDmgE,newDmgE);

// ============================================================
// 6. tickE — add missAnimT handling
// ============================================================
var oldTickE='if(e.dead){e.dying--;if(e.dying<=0)G.enemies.splice(i,1);continue;}\n    if(e.stun>0){e.stun--;e.state=\'miss\';continue;}\n    if(e.ht>0){e.ht--;if(e.ht===0)e.state=\'idle\';continue;}';
var newTickE='if(e.dead){e.dying--;if(e.dying<=0)G.enemies.splice(i,1);continue;}\n    if(e.missAnimT>0){e.missAnimT--;if(e.state!==\'miss\')e.state=\'miss\';continue;}\n    if(e.stun>0){e.stun--;e.state=\'miss\';continue;}\n    if(e.ht>0){e.ht--;if(e.ht===0)e.state=\'idle\';continue;}';
html=html.replace(oldTickE,newTickE);

// ============================================================
// 7. doAttack — remove per-unit knockback (now handled in dmgE), pass player coords to hurtP
// ============================================================
var oldDoAttack='if(dist<TILE*w.rng){dmgE(e,w.dmg);e.x+=(dx/dist)*8;e.y+=(dy/dist)*8;}';
var newDoAttack='if(dist<TILE*w.rng){dmgE(e,w.dmg);}';
html=html.replace(oldDoAttack,newDoAttack);

// ============================================================
// 8. All hurtP call sites — pass source coords
// ============================================================
// tickE: line ~1125 — enemy melee hits player
html=html.replace(
  'if(!e.rng&&dist<e.ar*TILE){\n        hurtP(e.dmg);e.state=\'attack\';e.curA=e.ac;',
  'if(!e.rng&&dist<e.ar*TILE){\n        hurtP(e.dmg,e.x,e.y);e.state=\'attack\';e.curA=e.ac;'
);

// tickE: line ~1121 — enemy ranged attacks player (addProj)
// Ranged attacks go through projectiles which call hurtP elsewhere
html=html.replace(
  'addProj(e.x,e.y,dx/dist*3.5,dy/dist*3.5,e.dmg,false);',
  'addProj(e.x,e.y,dx/dist*3.5,dy/dist*3.5,e.dmg,false);'
);

// tickProjs — projectiles hitting player: hurtP call ~line 1215
// Find and update the hurtP call in tickProjs
html=html.replace(
  'if(pl&&pl.invT<=0&&Math.hypot(p.x-pl.x,p.y-pl.y)<20){hurtP(p.dmg);return false;}',
  'if(pl&&pl.invT<=0&&Math.hypot(p.x-pl.x,p.y-pl.y)<20){hurtP(p.dmg,p.x,p.y);return false;}'
);

// tickBoss — boss hits player: ~line 1192
html=html.replace(
  'if(b.curA<=0){\n      hurtP(b.dmg||15);',
  'if(b.curA<=0){\n      hurtP(b.dmg||15,G.boss.x,G.boss.y);'
);

// ============================================================
// 9. addEnemyOne — add missAnimT initializer for new enemies
// ============================================================
html=html.replace(
  'dead:false,dying:0,ht:0,state:"idle",ang:0,stun:0,alpha:1',
  'dead:false,dying:0,ht:0,state:"idle",ang:0,stun:0,alpha:1,missAnimT:0'
);

// ============================================================
// 10. tickPlayer — reset knock velocity when transitioning to new room
// (Already handled — missAnimT and knockV* are part of player object recreated per room)

// ============================================================
// 11. tickPlayer — hurtT state check: when player is in miss state from hurtP, hurtT still counts down
// But state should NOT be overwritten by hurtT while missAnimT is active
// Fix: hurtT only sets state='hit' when missAnimT is 0
// ============================================================
var oldHurtTState='if(p.hurtT>0){p.hurtT--;p.state=\'hit\';}';
var newHurtTState='if(p.hurtT>0){p.hurtT--;if(p.missAnimT<=0)p.state=\'hit\';}';
html=html.replace(oldHurtTState,newHurtTState);

// ============================================================
// 12. tickE player collision with enemies — need attacker coords for hurtP
// Already handled in the replace above for line 1125

// 13. tickBoss player touching boss — already handled in replace above

// ============================================================
// 14. tickPlayer — also check map boundary when knockback pushes player out
// ============================================================
// Add map boundary clamp AFTER knockback in tickPlayer
// Actually, the knockback decay code is at the end of tickPlayer.
// The boundary check is done during normal movement. I should add boundary
// clamping for knockback too.
var oldBoundary='  if(p.wpnCd>0)p.wpnCd--;\n  if(p.missAnimT>0)p.missAnimT--;\n  // 击退衰减\n  if(Math.abs(p.knockVx)>0.1||Math.abs(p.knockVy)>0.1){\n    p.x+=p.knockVx;p.y+=p.knockVy;\n    p.knockVx*=0.82;p.knockVy*=0.82;\n    if(Math.abs(p.knockVx)<0.2)p.knockVx=0;\n    if(Math.abs(p.knockVy)<0.2)p.knockVy=0;\n  }\n}';
var newBoundary='  if(p.wpnCd>0)p.wpnCd--;\n  if(p.missAnimT>0)p.missAnimT--;\n  // 击退衰减(含地图边界夹紧)\n  if(Math.abs(p.knockVx)>0.1||Math.abs(p.knockVy)>0.1){\n    var _nkx=p.x+p.knockVx,_nky=p.y+p.knockVy;\n    var _nktx=Math.floor(_nkx/TILE),_nkty=Math.floor(_nky/TILE);\n    var _cls=Math.floor(W/TILE),_rws=Math.floor(H/TILE);\n    if(_nktx>0&&_nktx<_cls-1&&_nkty>0&&_nkty<_rws-1&&G.map[_nkty]&&G.map[_nkty][_nktx]===0){p.x=_nkx;p.y=_nky;}\n    p.knockVx*=0.82;p.knockVy*=0.82;\n    if(Math.abs(p.knockVx)<0.2)p.knockVx=0;\n    if(Math.abs(p.knockVy)<0.2)p.knockVy=0;\n  }\n}';
html=html.replace(oldBoundary,newBoundary);

fs.writeFileSync('game.html',html,'utf8');
console.log('All knockback changes applied');
