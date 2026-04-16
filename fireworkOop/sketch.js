// Fireworks OOP Demo

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = random(-5, 5);
    this.dy = random(-5, 5);
    this.radius = 3;
    this.r = random(255);
    this.g = random(255);
    this.b = random(255);
    this.opacity = 255;
  }

  display() {
    noStroke();
    fill(this.r, this.g, this.b, this.opacity);
    circle(this.x, this.y, this.radius*2);
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
  }

  isDead() {
    return this.opacity <= 0;
  }
}

let theFireworks = [];
const NUMBER_OF_FIREWORKS_PER_CLICK = 200;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  for (let aFirework of theFireworks) {
    aFirework.update();
    aFirework.display();

    if (aFirework.isDead()) {
      let index = theFireworks.indexOf(aFirework);
      theFireworks.splice(index, 1);
    }
    else {
      aFirework.update();
      aFirework.display();
    }
  }
  mousePressed();
}

function mousePressed() {
  for (let i = 0; i < NUMBER_OF_FIREWORKS_PER_CLICK; i++) {
    let aFirework = new Particle(mouseX, mouseY);
    theFireworks.push(aFirework);
  }
}