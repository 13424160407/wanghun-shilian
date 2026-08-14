var fs=require('fs');
var lines=fs.readFileSync('game.html','utf8').split(/\r?\n/);
var changes=0;

// Remove cache block in drawGameUI: find lines containing _hudTargets assignment
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("window._hudTargets[g.icon]={x:")>=0){
    // Remove 5 lines: comment, if, var _cr, var _sx, window._hudTargets
    lines.splice(i-4,5);
    console.log('1. Removed _hudTargets cache from drawGameUI (lines '+(i-3)+'-'+(i+1)+')');
    changes++;
    break;
  }
}

// Fix death animation: replace _ht-based lookups
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("_ht.nl01||getHUDTargetCenter('nl01')")>=0){
    // Replace these 5 lines (comment + var _ht + 3 coord lines)
    lines[i-1]="  var nl01Center=getHUDTargetCenter('nl01');";
    lines[i]="  var jys01Center=getHUDTargetCenter('jys01');";
    lines[i+1]="  var qianbi01Center=getHUDTargetCenter('qianbi01');";
    console.log('2. Fixed death animation at line '+(i));
    changes++;
    break;
  }
}
// Remove the remaining _ht line that was left behind
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("var _ht=window._hudTargets||{}")>=0){
    lines.splice(i,1);
    console.log('2b. Removed _ht line');
    break;
  }
}

// Fix win animation: replace _ht2-based lookups
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("_ht2.nl01||getHUDTargetCenter('nl01')")>=0){
    lines[i]="  var nl01Center=getHUDTargetCenter('nl01');";
    lines[i+1]="  var jys01Center=getHUDTargetCenter('jys01');";
    lines[i+2]="  var qianbi01Center=getHUDTargetCenter('qianbi01');";
    console.log('3. Fixed win animation at line '+(i));
    changes++;
    break;
  }
}
// Remove the remaining _ht2 line
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf("var _ht2=window._hudTargets||{}")>=0){
    lines.splice(i,1);
    console.log('3b. Removed _ht2 line');
    break;
  }
}

// Write back
fs.writeFileSync('game.html',lines.join('\r\n'),'utf8');

// Final check
var html=fs.readFileSync('game.html','utf8');
var refs=html.match(/_hudTargets/g);
console.log('Remaining _hudTargets:',refs?refs.length:0);
console.log('Done - '+changes+' sections modified');
