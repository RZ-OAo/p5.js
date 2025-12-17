/* ===============================
   DESIGN SIZE (DO NOT CHANGE)
================================ */

const DESIGN_W = 980;
const DESIGN_H = 560;

/* ===============================
   TRACK DATA
================================ */

let tracks = [
  { title: "Preludes Op.28 No.7 – Chopin", file: "assets/preludes_op28_no7.mp3" },
  { title: "Sonatina No.1 Allegro – Clementi", file: "assets/sonatina_no1_allegro.mp3" },
  { title: "Cantata BWV 201 – Bach", file: "assets/cantata_bwv201.mp3" },
  { title: "Goldberg Var. 6 – Bach", file: "assets/goldberg_var6.mp3" }
];

let currentTrack = 0;
let sound, fft;
let isPlaying = false;
let loopMode = false;

/* ===============================
   AUDIO
================================ */

let lowPass, bandPass, highPass;
let eq = { low: 0, mid: 0, high: 0 };
let volume = 0.8;

/* ===============================
   UI STATE
================================ */

let vinylAngle = 0;
let scratching = false;
let lastMouseX = 0;
let draggingProgress = false;
let draggingKnob = null;

/* ===============================
   LAYOUT SYSTEM
================================ */

const LEFT_W = 360;
const RIGHT_X = LEFT_W + 40;
const TOP = 40;
const LINE = 32;
const CONTROL_Y = DESIGN_H - 90;
const KNOB_Y = DESIGN_H - 45;

/* ===============================
   RESPONSIVE
================================ */

let scaleFactor = 1;

function preload() {
  soundFormats("mp3");
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT();

  lowPass = new p5.LowPass();
  bandPass = new p5.BandPass();
  highPass = new p5.HighPass();

  setupAudioChain();
  sound.onended(onTrackEnd);
  sound.setVolume(volume);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* ===============================
   AUDIO CHAIN
================================ */

function setupAudioChain() {
  sound.disconnect();
  sound.connect(lowPass);
  lowPass.connect(bandPass);
  bandPass.connect(highPass);
  highPass.connect();
}

/* ===============================
   DRAW
================================ */

function draw() {
  background(10);

  scaleFactor = min(width / DESIGN_W, height / DESIGN_H);
  translate(
    (width - DESIGN_W * scaleFactor) / 2,
    (height - DESIGN_H * scaleFactor) / 2
  );
  scale(scaleFactor);

  drawPanels();
  drawVinyl();
  drawTrackInfo();
  drawPlaylist();
  drawSpectrum();
  drawProgress();
  drawControls();
  drawEQ();
  drawVolume();

  applyEQ();
}

/* ===============================
   PANELS
================================ */

function drawPanels() {
  noStroke();
  fill(20);
  rect(0, 0, LEFT_W, DESIGN_H);
  rect(LEFT_W, 0, DESIGN_W - LEFT_W, DESIGN_H);

  fill(15);
  rect(LEFT_W, DESIGN_H - 140, DESIGN_W - LEFT_W, 140);
}

/* ===============================
   VINYL
================================ */

function drawVinyl() {
  let cx = LEFT_W / 2;
  let cy = DESIGN_H / 2;
  let r = 140;

  push();
  translate(cx, cy);
  if (isPlaying && !scratching) vinylAngle += 0.02;
  rotate(vinylAngle);

  stroke(90);
  noFill();
  ellipse(0, 0, r * 2);
  for (let i = 60; i < r * 2; i += 12) ellipse(0, 0, i);

  fill(20);
  noStroke();
  ellipse(0, 0, 50);
  pop();
}

/* ===============================
   INFO
================================ */

function drawTrackInfo() {
  fill(230);
  textSize(20);
  textAlign(LEFT);
  text(tracks[currentTrack].title, RIGHT_X, TOP);
}

function drawPlaylist() {
  let y = TOP + 40;
  textSize(14);
  for (let i = 0; i < tracks.length; i++) {
    fill(i === currentTrack ? 240 : 130);
    text(tracks[i].title, RIGHT_X, y + i * LINE);
  }
}

/* ===============================
   SPECTRUM
================================ */

function drawSpectrum() {
  let spectrum = fft.analyze();
  push();
  translate(RIGHT_X + 260, DESIGN_H / 2 - 40);
  noFill();
  stroke(180, 160);
  beginShape();
  for (let i = 0; i < spectrum.length; i += 8) {
    let x = map(i, 0, spectrum.length, -200, 200);
    let y = map(spectrum[i], 0, 255, 60, -60);
    curveVertex(x, y);
  }
  endShape();
  pop();
}

/* ===============================
   PROGRESS
================================ */

function drawProgress() {
  let x = RIGHT_X;
  let y = CONTROL_Y - 26;
  let w = 520;

  stroke(80);
  line(x, y, x + w, y);

  if (!sound.isLoaded()) return;
  let p = sound.currentTime() / sound.duration();

  stroke(220);
  line(x, y, x + w * p, y);

  noStroke();
  fill(180);
  textSize(12);
  text(formatTime(sound.currentTime()) + " / " + formatTime(sound.duration()), x, y + 16);
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let x = RIGHT_X;
  drawBtn(x + 40, CONTROL_Y, "⏮");
  drawBtn(x + 100, CONTROL_Y, isPlaying ? "⏸" : "▶");
  drawBtn(x + 160, CONTROL_Y, "⏭");
  drawBtn(x + 220, CONTROL_Y, loopMode ? "🔁" : "➡");
}

/* ===============================
   EQ + VOL
================================ */

function drawEQ() {
  drawKnob(RIGHT_X + 320, KNOB_Y, eq.low, "LOW");
  drawKnob(RIGHT_X + 380, KNOB_Y, eq.mid, "MID");
  drawKnob(RIGHT_X + 440, KNOB_Y, eq.high, "HIGH");
}

function drawVolume() {
  drawKnob(RIGHT_X + 500, KNOB_Y, map(volume, 0, 1, -1, 1), "VOL");
}

/* ===============================
   UI ELEMENTS
================================ */

function drawBtn(x, y, label) {
  fill(30);
  stroke(120);
  ellipse(x, y, 38);
  fill(230);
  noStroke();
  textAlign(CENTER, CENTER);
  text(label, x, y);
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

  fill(120);
  noStroke();
  textSize(10);
  textAlign(CENTER);
  text(label, x, y + 26);
}

/* ===============================
   INTERACTION
================================ */

function mousePressed() {
  userStartAudio();

  let mx = (mouseX - (width - DESIGN_W * scaleFactor) / 2) / scaleFactor;
  let my = (mouseY - (height - DESIGN_H * scaleFactor) / 2) / scaleFactor;

  if (dist(mx, my, RIGHT_X + 100, CONTROL_Y) < 19) togglePlay();
  if (dist(mx, my, RIGHT_X + 40, CONTROL_Y) < 19) prevTrack();
  if (dist(mx, my, RIGHT_X + 160, CONTROL_Y) < 19) nextTrack();
  if (dist(mx, my, RIGHT_X + 220, CONTROL_Y) < 19) loopMode = !loopMode;

  if (dist(mx, my, LEFT_W / 2, DESIGN_H / 2) < 140) {
    scratching = true;
    sound.pause();
    lastMouseX = mx;
  }

  if (my > CONTROL_Y - 40 && my < CONTROL_Y - 20 &&
      mx > RIGHT_X && mx < RIGHT_X + 520) {
    draggingProgress = true;
  }

  if (dist(mx, my, RIGHT_X + 320, KNOB_Y) < 18) draggingKnob = "low";
  if (dist(mx, my, RIGHT_X + 380, KNOB_Y) < 18) draggingKnob = "mid";
  if (dist(mx, my, RIGHT_X + 440, KNOB_Y) < 18) draggingKnob = "high";
  if (dist(mx, my, RIGHT_X + 500, KNOB_Y) < 18) draggingKnob = "volume";
}

function mouseDragged() {
  if (!sound.isLoaded()) return;

  let mx = (mouseX - (width - DESIGN_W * scaleFactor) / 2) / scaleFactor;

  if (scratching) {
    let dx = mx - lastMouseX;
    sound.jump(constrain(sound.currentTime() + dx * 0.01, 0, sound.duration()));
    vinylAngle += dx * 0.01;
    lastMouseX = mx;
  }

  if (draggingProgress) {
    let p = constrain((mx - RIGHT_X) / 520, 0, 1);
    sound.jump(sound.duration() * p);
  }

  if (draggingKnob === "volume") {
    volume = constrain(volume - (mouseY - pmouseY) * 0.01, 0, 1);
    sound.setVolume(volume);
  }

  if (draggingKnob && draggingKnob !== "volume") {
    eq[draggingKnob] = constrain(eq[draggingKnob] - (mouseY - pmouseY) * 0.01, -1, 1);
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
   AUDIO LOGIC
================================ */

function togglePlay() {
  sound.isPlaying() ? sound.pause() : sound.play();
  isPlaying = sound.isPlaying();
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
    setupAudioChain();
    sound.onended(onTrackEnd);
    sound.setVolume(volume);
    sound.play();
    isPlaying = true;
  });
}

function onTrackEnd() {
  loopMode ? sound.jump(0) : nextTrack();
}

function applyEQ() {
  lowPass.freq(map(eq.low, -1, 1, 80, 600));
  bandPass.freq(map(eq.mid, -1, 1, 300, 2500));
  highPass.freq(map(eq.high, -1, 1, 2500, 10000));
}

/* ===============================
   UTIL
================================ */

function formatTime(t) {
  let m = floor(t / 60);
  let s = floor(t % 60);
  return nf(m, 2) + ":" + nf(s, 2);
}
