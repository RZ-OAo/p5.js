/* ===============================
   TRACK DATA
================================ */

let tracks = [
  { title: "Preludes Op.28 No.7 – Chopin", file: "assets/preludes.mp3" },
  { title: "Sonatina No.1 Allegro – Clementi", file: "assets/sonatina.mp3" },
  { title: "Cantata BWV 201 – Bach", file: "assets/cantata.mp3" },
  { title: "Goldberg Var. 6 – Bach", file: "assets/goldberg.mp3" }
];

let currentTrack = 0;
let sound, fft;
let isPlaying = false;
let isLooping = false;

/* ===============================
   AUDIO FILTERS (REAL)
================================ */

let lowPass, highPass;
let eq = { low: 0.5, mid: 0.5, high: 0.5 };

/* ===============================
   UI STATES
================================ */

let vinylAngle = 0;
let scratching = false;
let lastScrubX = 0;

/* ===============================
   CANVAS
================================ */

const W = 980;
const H = 560;

function touchStarted() {
  userStartAudio();
}

function preload() {
  soundFormats("mp3");
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(W, H);

  fft = new p5.FFT(0.7, 256);

  lowPass = new p5.LowPass();
  highPass = new p5.HighPass();

  setupAudio();
}

function setupAudio() {
  sound.disconnect();
  sound.connect(lowPass);
  lowPass.connect(highPass);
  highPass.connect();

  updateEQ();
}

/* ===============================
   DRAW
================================ */

function draw() {
  background(15);

  drawVinyl();
  drawSpectrum();
  drawTrackInfo();
  drawProgress();
  drawControls();
  drawEQ();
}

/* ===============================
   VINYL + SCRATCH
================================ */

function drawVinyl() {
  let cx = 240, cy = height / 2, r = 140;

  push();
  translate(cx, cy);

  if (isPlaying && !scratching) vinylAngle += 0.01;
  rotate(vinylAngle);

  stroke(80);
  noFill();
  ellipse(0, 0, r * 2);

  for (let i = 100; i < r * 2; i += 10) {
    stroke(40);
    ellipse(0, 0, i);
  }

  fill(20);
  noStroke();
  ellipse(0, 0, 50);

  pop();
}

/* ===============================
   SPECTRUM
================================ */

function drawSpectrum() {
  let spectrum = fft.analyze();
  push();
  translate(500, height / 2);
  noFill();
  stroke(200, 200, 200, 150);
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
   INFO
================================ */

function drawTrackInfo() {
  fill(220);
  textSize(18);
  text(tracks[currentTrack].title, 420, 60);
}

/* ===============================
   PROGRESS
================================ */

function drawProgress() {
  let x = 420, y = height - 80, w = 460;

  stroke(60);
  line(x, y, x + w, y);

  if (!sound.isLoaded()) return;

  let p = sound.currentTime() / sound.duration();
  stroke(220);
  line(x, y, x + w * p, y);

  fill(180);
  noStroke();
  textSize(12);
  text(formatTime(sound.currentTime()) + " / " + formatTime(sound.duration()), x, y - 10);
}

function formatTime(t) {
  let m = floor(t / 60);
  let s = floor(t % 60);
  return nf(m, 2) + ":" + nf(s, 2);
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let y = height - 40;
  drawBtn(520, y, "⏮", prevTrack);
  drawBtn(580, y, isPlaying ? "⏸" : "▶", togglePlay);
  drawBtn(640, y, "⏭", nextTrack);
  drawBtn(700, y, isLooping ? "🔁" : "➡", toggleLoop);
}

/* ===============================
   EQ UI
================================ */

function drawEQ() {
  let x = 760, y = height - 60;
  drawKnob(x, y, eq.low, "LOW");
  drawKnob(x + 60, y, eq.mid, "MID");
  drawKnob(x + 120, y, eq.high, "HIGH");
}

function drawKnob(x, y, v, label) {
  push();
  translate(x, y);
  stroke(100);
  fill(20);
  ellipse(0, 0, 34);
  rotate(map(v, 0, 1, -PI * .75, PI * .75));
  stroke(220);
  line(0, 0, 0, -12);
  pop();

  fill(120);
  noStroke();
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

  if (dist(mouseX, mouseY, x, y) < 19 && mouseIsPressed) action();
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

function toggleLoop() {
  isLooping = !isLooping;
  sound.setLoop(isLooping);
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
    setupAudio();
    sound.play();
    isPlaying = true;
  });
}

/* ===============================
   SCRATCH + SEEK
================================ */

function mousePressed() {
  let cx = 240, cy = height / 2, r = 140;

  if (dist(mouseX, mouseY, cx, cy) < r) {
    scratching = true;
    sound.pause();
    lastScrubX = mouseX;
  }

  let barX = 420, barW = 460, barY = height - 80;
  if (mouseY > barY - 10 && mouseY < barY + 10 &&
      mouseX > barX && mouseX < barX + barW) {
    sound.jump(sound.duration() * ((mouseX - barX) / barW));
  }
}

function mouseDragged() {
  if (!scratching) return;

  let dx = mouseX - lastScrubX;
  let t = sound.currentTime() + dx * 0.01;
  sound.jump(constrain(t, 0, sound.duration()));
  vinylAngle += dx * 0.005;
  lastScrubX = mouseX;
}

function mouseReleased() {
  if (scratching) {
    scratching = false;
    sound.play();
  }
}

/* ===============================
   EQ APPLY
================================ */

function updateEQ() {
  lowPass.freq(map(eq.low, 0, 1, 100, 800));
  highPass.freq(map(eq.high, 0, 1, 2000, 10000));
}
