const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let x = 0
let vx = 5
let y = 0
let vy = 4
let gravity = 1;
function animate(){
    ctx.clearRect(0,0,800,800);
    ctx.fillRect(x,y,50,50)
    if(y < 0){
        y = 300
    }
    if(y > 300){
        y = 0
    }    
    if(x < 0){
        x = 500
    }
    if(x > 500){
        x = 0
    }
    requestAnimationFrame(animate);
}
animate();
    //event handler
function handleKeyDown(e){
    if(e.key == "d"){
    x = x + 20
    }
    if(e.key == "a"){
        x = x - 20}
    if(e.key == "w"){
        y = y - 20}
    if(e.key == "s"){
        y = y + 20}
    }
//event listener
document.addEventListener('keydown', handleKeyDown);
