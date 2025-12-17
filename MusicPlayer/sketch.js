/* ===============================
   TRACK DATA
================================ */

let tracks = [
  { title: "Preludes Op.28 No.7 – Chopin", file: "assets/Preludes, Op. 28 - No. 7 'The Polish dancer'.mp3" },
  { title: "Sonatina No.1 Allegro – Clementi", file: "assets/Sonatina N.1 -  1 Mov. Allegro.mp3" },
  { title: "Cantata BWV 201 – Bach", file: "assets/Cantata BWV 201 - 8. Recitatif Mercure et Tmolus b.mp3" },
  { title: "Goldberg Var. 6 – Bach", file: "assets/Goldberg Variations, BWV. 988 - Variation 6. Canon on the second.mp3" }
];

let currentTrack = 0;
let sound, fft, amp;
let isPlaying = false;

/* ===============================
   UI STATES
================================ */

let volume = 0.7;
let targetVolume = 0.7;
let eq = { low: 0.5, mid: 0.5, high: 0.5 };

let vinylAngle = 0;
let scrollOffset = 0;
let scratching = false;
let lastScrubX = 0;
let lastTime = 0;

/* ===============================
   CANVAS
================================ */

const W = 980;
const H = 560;

function touchStarted() {
  userStartAudio();
}

function preload() {
  soundFormats('mp3');
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(W, H);
  fft = new p5.FFT(0.7, 256);
  amp = new p5.Amplitude();
  sound.setVolume(volume);
}

function draw() {
  background(15);

  drawVinyl();
  drawSpectrum();
  drawTrackInfo();
  drawPlaylist();
  drawProgress();
  drawControls();
  drawEQ();
}

/* ===============================
   VINYL
================================ */

function drawVinyl() {
  let cx = 240;
  let cy = height / 2;
  let r = 140;

  push();
  translate(cx, cy);

  if (!scratching && isPlaying) vinylAngle += 0.01;

  rotate(vinylAngle);

  stroke(80);
  noFill();
  ellipse(0, 0, r * 2);

  for (let i = 90; i < r * 2; i += 10) {
    stroke(40);
    ellipse(0, 0, i);
  }

  fill(20);
  noStroke();
  ellipse(0, 0, 50);

  pop();

  // hover hint
  if (dist(mouseX, mouseY, cx, cy) < r) {
    fill(255, 255, 255, 40);
    noStroke();
    ellipse(cx, cy, r * 2);
  }
}


/* ===============================
   SPECTRUM (Bezier)
================================ */

function drawSpectrum() {
  let spectrum = fft.analyze();

  push();
  translate(500, height / 2);
  noFill();
  stroke(200, 200, 200, 160);
  strokeWeight(2);

  beginShape();
  for (let i = 0; i < spectrum.length; i += 6) {
    let x = map(i, 0, spectrum.length, -200, 200);
    let y = map(spectrum[i], 0, 255, 80, -80);
    curveVertex(x, y);
  }
  endShape();

  pop();
}

/* ===============================
   TEXT INFO
================================ */

function drawTrackInfo() {
  fill(220);
  textSize(18);
  textAlign(LEFT);
  text(tracks[currentTrack].title, 420, 60);
}

/* ===============================
   PLAYLIST
================================ */

function drawPlaylist() {
  let x = 420;
  let y = 100;

  textSize(13);

  for (let i = 0; i < tracks.length; i++) {
    let ty = y + i * 28 + scrollOffset;

    if (ty < 90 || ty > height - 80) continue;

    fill(i === currentTrack ? 220 : 120);
    text(tracks[i].title, x, ty);
  }
}

/* ===============================
   PROGRESS BAR
================================ */

function drawProgress() {
  let x = 420;
  let y = height - 80;
  let w = 460;

  stroke(60);
  line(x, y, x + w, y);

  if (sound.isLoaded()) {
    let p = sound.currentTime() / sound.duration();
    stroke(220);
    line(x, y, x + w * p, y);
  }
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let y = height - 40;
  drawBtn(520, y, "⏮", prevTrack);
  drawBtn(580, y, isPlaying ? "⏸" : "▶", togglePlay);
  drawBtn(640, y, "⏭", nextTrack);
}

/* ===============================
   EQ
================================ */

function drawEQ() {
  let x = 760;
  let y = height - 60;

  drawKnob(x, y, eq.low, "LOW");
  drawKnob(x + 60, y, eq.mid, "MID");
  drawKnob(x + 120, y, eq.high, "HIGH");
}

function drawKnob(x, y, val, label) {
  push();
  translate(x, y);

  stroke(100);
  fill(20);
  ellipse(0, 0, 34);

  rotate(map(val, 0, 1, -PI * .75, PI * .75));
  stroke(220);
  line(0, 0, 0, -12);

  pop();

  noStroke();
  fill(120);
  textSize(10);
  textAlign(CENTER);
  text(label, x, y + 28);
}

/* ===============================
   BUTTON
================================ */

function drawBtn(x, y, label, action) {
  fill(25);
  stroke(90);
  ellipse(x, y, 38);

  fill(230);
  noStroke();
  textAlign(CENTER, CENTER);
  text(label, x, y);

  if (dist(mouseX, mouseY, x, y) < 19 && mouseIsPressed) {
    action();
  }
}

/* ===============================
   AUDIO CONTROL
================================ */

function togglePlay() {
  if (sound.isPlaying()) {
    sound.pause();
    isPlaying = false;
  } else {
    sound.play();
    isPlaying = true;
  }
}

function nextTrack() {
  changeTrack((currentTrack + 1) % tracks.length);
}

function prevTrack() {
  changeTrack((currentTrack - 1 + tracks.length) % tracks.length);
}

function changeTrack(i) {
  sound.stop();
  currentTrack = i;
  sound = loadSound(tracks[i].file, () => {
    sound.setVolume(volume);
    sound.play();
    isPlaying = true;
  });
}

/* ===============================
   INTERACTION
================================ */

function mouseWheel(e) {
  scrollOffset -= e.delta * 0.2;
}

function mousePressed() {
  let cx = 240;
  let cy = height / 2;

  if (dist(mouseX, mouseY, cx, cy) < 140) {
    scratching = true;
    lastScrubX = mouseX;
    lastTime = sound.currentTime();
    sound.rate(0.4);
  }
}
function mouseDragged() {
  if (!scratching || !sound.isLoaded()) return;

  let dx = mouseX - lastScrubX;
  let scrubSpeed = dx * 0.01;

  let newTime = constrain(
    lastTime + scrubSpeed,
    0,
    sound.duration()
  );

  sound.jump(newTime);

  vinylAngle += dx * 0.005;
}
function mouseReleased() {
  if (scratching) {
    scratching = false;
    sound.rate(1);
  }
}

