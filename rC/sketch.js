// Recursion Circles Demo


function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  drawCircle(width/2, width/2);
}

function drawCircle(x, radius) {
  let fillColor = map(radius, width/2, 50, 255, 50);
  fill(fillColor);
  circle(x, height/2, radius*2);
  
  let maxRadiuse = map(mouseX, 0, width, width/2, 50);
  if (radius > maxRadiuse) {
    drawCircle(x-radius/2, radius/2);
    drawCircle(x+radius/2, radius/2);
  }
}