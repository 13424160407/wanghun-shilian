var fs=require('fs');
var lines=fs.readFileSync('game.html','utf8').split(/\r?\n/);
var dirty=false;

// Remove leftover _ht.qianbi01 lines (from incomplete fix)
for(var i=lines.length-1;i>=0;i--){
  if(lines[i].indexOf('_ht.qianbi01')>=0){
    console.log('Removing leftover _ht.qianbi01 at line '+(i+1)+': '+lines[i].trim());
    lines.splice(i,1);
    dirty=true;
  }
  if(lines[i].indexOf('_ht2.qianbi01')>=0 || lines[i].indexOf('_ht2.jys01')>=0 || lines[i].indexOf('_ht2.nl01')>=0){
    console.log('Removing leftover _ht2 line at '+(i+1)+': '+lines[i].trim());
    lines.splice(i,1);
    dirty=true;
  }
  if(lines[i].indexOf('_ht.jys01')>=0 || lines[i].indexOf('_ht.nl01')>=0){
    console.log('Removing leftover _ht line at '+(i+1)+': '+lines[i].trim());
    lines.splice(i,1);
    dirty=true;
  }
}

// Double-check: no _hudTargets or _ht references left in variable declarations
for(var i=0;i<lines.length;i++){
  if(lines[i].indexOf('_ht')>=0 || lines[i].indexOf('_hudTarget')>=0){
    console.log('Found at line '+(i+1)+': '+lines[i].trim());
  }
}

if(dirty){
  fs.writeFileSync('game.html',lines.join('\r\n'),'utf8');
  console.log('Fixed');
} else {
  console.log('Already clean');
}
