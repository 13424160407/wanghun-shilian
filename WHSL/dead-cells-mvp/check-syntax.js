var fs=require('fs');
var html=fs.readFileSync('game.html','utf8');
var start=html.indexOf('<script>',html.indexOf('<script>')+1);
var end=html.lastIndexOf('</script>');
var js=html.substring(start+8,end);
try{
  new Function(js);
  console.log('JS syntax PASS');
}catch(e){
  console.log('FAIL: '+e.message);
  // Find the line where parse fails
  var lines=js.split('\n');
  var match=e.stack.match(/game<anonymous>:(\d+)/);
  if(match) console.log('Line:',match[1],'->',lines[parseInt(match[1])-1]);
}
