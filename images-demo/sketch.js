// Image Demo

let marioimg;

function preload() {
  marioimg = loadImage("Mario.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
}

function draw() {
  background(220);
  image(marioimg, mouseX, mouseY, marioimg.width * 0.5, marioimg.height * 0.5);
}
