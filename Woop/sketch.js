// Walker OOP Demo

class Walker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.diameter = 2;
    this.speed = 5;
    this.color = "red";
  }

  display() {
    fill(this.color);
    stroke(this.color);
    circle(this.x, this.y, this.diameter);
  }
  
  move() {
    let choice = random(100);
    if (choice < 25) {
      //right
      this.x += this.speed;
    }
    else if (choice < 50) {
      //left
      this.x -= this.speed;
    }
    else if (choice < 75) {
      //down
      this.y += this.speed;
    }
    else {
      //up
      this.y -= this.speed;
    }
  }
}

let artin;
let aiden;

function setup() {
  createCanvas(windowWidth, windowHeight);
  artin = new Walker(width/2, height/2);
  aiden = new Walker(200, 200);
  aiden.color = "blue";
}

function draw() {
  artin.move();
  aiden.move();

  artin.display();
  aiden.display();
}
