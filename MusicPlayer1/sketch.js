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
let sound, fft, amp, eqFilter;
let isPlaying = false;
let loopMode = false;

/* ===============================
   UI STATES
================================ */

let volume = 0.7;
let eq = { low: 0, mid: 0, high: 0 };

let vinylAngle = 0;
let scratching = false;
let lastMouseX = 0;

let draggingProgress = false;
let draggingKnob = null;

/* ===============================
   CANVAS
================================ */

const W = 980;
const H = 560;

function preload() {
  soundFormats('mp3');
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(W, H);

  fft = new p5.FFT();
  amp = new p5.Amplitude();

  eqFilter = new p5.EQ(3);
  sound.disconnect();
  sound.connect(eqFilter);

  sound.setVolume(volume);
  sound.onended(onTrackEnd);
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
   VINYL SCRATCH
================================ */

function drawVinyl() {
  let cx = 240;
  let cy = height / 2;
  let r = 140;

  push();
  translate(cx, cy);

  if (isPlaying && !scratching) vinylAngle += 0.02;
  rotate(vinylAngle);

  stroke(80);
  noFill();
  ellipse(0, 0, r * 2);
  for (let i = 60; i < r * 2; i += 12) ellipse(0, 0, i);

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
  stroke(200, 160);
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
  text(tracks[currentTrack].title, 420, 50);
}

/* ===============================
   PLAYLIST
================================ */

function drawPlaylist() {
  let y = 90;
  textSize(13);
  for (let i = 0; i < tracks.length; i++) {
    fill(i === currentTrack ? 220 : 120);
    text(tracks[i].title, 420, y + i * 26);
  }
}

/* ===============================
   PROGRESS BAR
================================ */

function drawProgress() {
  let x = 420;
  let y = height - 90;
  let w = 460;

  stroke(80);
  line(x, y, x + w, y);

  if (!sound.isLoaded()) return;

  let p = sound.currentTime() / sound.duration();
  stroke(220);
  line(x, y, x + w * p, y);

  noStroke();
  fill(180);
  textSize(12);
  textAlign(LEFT);
  text(formatTime(sound.currentTime()) + " / " + formatTime(sound.duration()), x, y + 20);
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let y = height - 40;
  drawBtn(520, y, "⏮", prevTrack);
  drawBtn(580, y, isPlaying ? "⏸" : "▶", togglePlay);
  drawBtn(640, y, "⏭", nextTrack);
  drawBtn(700, y, loopMode ? "🔁" : "➡", () => loopMode = !loopMode);
}

/* ===============================
   EQ
================================ */

function drawEQ() {
  drawKnob(760, height - 60, eq.low, "LOW");
  drawKnob(820, height - 60, eq.mid, "MID");
  drawKnob(880, height - 60, eq.high, "HIGH");

  eqFilter.setLow(eq.low * 20);
  eqFilter.setMid(eq.mid * 20);
  eqFilter.setHigh(eq.high * 20);
}

function drawKnob(x, y, val, label) {
  push();
  translate(x, y);
  fill(30);
  stroke(120);
  ellipse(0, 0, 36);
  rotate(map(val, -1, 1, -PI * 0.75, PI * 0.75));
  stroke(220);
  line(0, 0, 0, -14);
  pop();

  noStroke();
  fill(120);
  textSize(10);
  textAlign(CENTER);
  text(label, x, y + 26);
}

/* ===============================
   BUTTON
================================ */

function drawBtn(x, y, label, action) {
  fill(30);
  stroke(120);
  ellipse(x, y, 38);

  fill(230);
  noStroke();
  textAlign(CENTER, CENTER);
  text(label, x, y);

  if (mouseIsPressed && dist(mouseX, mouseY, x, y) < 19) action();
}

/* ===============================
   AUDIO
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
    sound.disconnect();
    sound.connect(eqFilter);
    sound.play();
    isPlaying = true;
  });
}

function onTrackEnd() {
  if (loopMode) sound.play();
  else nextTrack();
}

/* ===============================
   INTERACTION
================================ */

function mousePressed() {
  // vinyl
  if (dist(mouseX, mouseY, 240, height / 2) < 140) {
    scratching = true;
    sound.pause();
    lastMouseX = mouseX;
  }

  // progress bar
  if (mouseY > height - 100 && mouseY < height - 80) draggingProgress = true;

  // EQ knobs
  if (dist(mouseX, mouseY, 760, height - 60) < 18) draggingKnob = "low";
  if (dist(mouseX, mouseY, 820, height - 60) < 18) draggingKnob = "mid";
  if (dist(mouseX, mouseY, 880, height - 60) < 18) draggingKnob = "high";
}

function mouseDragged() {
  if (scratching && sound.isLoaded()) {
    let dx = mouseX - lastMouseX;
    let t = sound.currentTime() + dx * 0.01;
    sound.jump(constrain(t, 0, sound.duration()));
    vinylAngle += dx * 0.01;
    lastMouseX = mouseX;
  }

  if (draggingProgress && sound.isLoaded()) {
    let p = constrain((mouseX - 420) / 460, 0, 1);
    sound.jump(sound.duration() * p);
  }

  if (draggingKnob) {
    eq[draggingKnob] = constrain(eq[draggingKnob] - movedY * 0.01, -1, 1);
  }
}

function mouseReleased() {
  if (scratching) {
    scratching = false;
    sound.play();
  }
  draggingProgress = false;
  draggingKnob = null;
}

/* ===============================
   UTIL
================================ */

function formatTime(t) {
  let m = floor(t / 60);
  let s = floor(t % 60);
  return nf(m, 2) + ":" + nf(s, 2);
}
