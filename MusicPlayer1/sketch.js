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
   AUDIO FILTERS
================================ */

let lowPass, bandPass, highPass;
let eq = { low: 0, mid: 0, high: 0 };

/* ===============================
   UI STATES
================================ */

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

/* ===============================
   LAYOUT
================================ */

const LEFT_CENTER_X = 240;
const RIGHT_X = 420;
const CONTROL_Y = H - 60;
const PROGRESS_Y = H - 100;

function preload() {
  soundFormats("mp3");
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(W, H);

  fft = new p5.FFT();

  lowPass = new p5.LowPass();
  bandPass = new p5.BandPass();
  highPass = new p5.HighPass();

  setupAudioChain();
  sound.onended(onTrackEnd);
}

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
  background(15);

  drawVinyl();
  drawSpectrum();
  drawTrackInfo();
  drawPlaylist();
  drawProgress();
  drawControls();
  drawEQ();

  applyEQ();
}

/* ===============================
   VINYL
================================ */

function drawVinyl() {
  let cx = LEFT_CENTER_X;
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
  translate(RIGHT_X + 240, height / 2);
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
  textAlign(LEFT);
  text(tracks[currentTrack].title, RIGHT_X, 50);
}

/* ===============================
   PLAYLIST
================================ */

function drawPlaylist() {
  let y = 90;
  textSize(13);
  textAlign(LEFT);
  for (let i = 0; i < tracks.length; i++) {
    fill(i === currentTrack ? 220 : 120);
    text(tracks[i].title, RIGHT_X, y + i * 30);
  }
}

/* ===============================
   PROGRESS
================================ */

function drawProgress() {
  let x = RIGHT_X;
  let y = PROGRESS_Y;
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
  text(
    formatTime(sound.currentTime()) + " / " + formatTime(sound.duration()),
    x,
    y + 18
  );
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let y = CONTROL_Y;
  drawBtn(RIGHT_X + 100, y, "⏮");
  drawBtn(RIGHT_X + 160, y, isPlaying ? "⏸" : "▶");
  drawBtn(RIGHT_X + 220, y, "⏭");
  drawBtn(RIGHT_X + 280, y, loopMode ? "🔁" : "➡");
}

/* ===============================
   EQ
================================ */

function drawEQ() {
  drawKnob(RIGHT_X + 360, H - 60, eq.low, "LOW");
  drawKnob(RIGHT_X + 420, H - 60, eq.mid, "MID");
  drawKnob(RIGHT_X + 480, H - 60, eq.high, "HIGH");
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
   BUTTON VISUAL
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

/* ===============================
   INTERACTION
================================ */

function mousePressed() {
  userStartAudio();

  if (dist(mouseX, mouseY, RIGHT_X + 160, CONTROL_Y) < 19) togglePlay();
  if (dist(mouseX, mouseY, RIGHT_X + 100, CONTROL_Y) < 19) prevTrack();
  if (dist(mouseX, mouseY, RIGHT_X + 220, CONTROL_Y) < 19) nextTrack();
  if (dist(mouseX, mouseY, RIGHT_X + 280, CONTROL_Y) < 19) loopMode = !loopMode;

  if (dist(mouseX, mouseY, LEFT_CENTER_X, height / 2) < 140) {
    scratching = true;
    sound.pause();
    lastMouseX = mouseX;
  }

  let barY = PROGRESS_Y;
  if (
    mouseY > barY - 8 &&
    mouseY < barY + 8 &&
    mouseX > RIGHT_X &&
    mouseX < RIGHT_X + 460
  ) {
    draggingProgress = true;
  }

  if (dist(mouseX, mouseY, RIGHT_X + 360, H - 60) < 18) draggingKnob = "low";
  if (dist(mouseX, mouseY, RIGHT_X + 420, H - 60) < 18) draggingKnob = "mid";
  if (dist(mouseX, mouseY, RIGHT_X + 480, H - 60) < 18) draggingKnob = "high";
}

function mouseDragged() {
  if (scratching && sound.isLoaded()) {
    let dx = mouseX - lastMouseX;
    sound.jump(
      constrain(sound.currentTime() + dx * 0.01, 0, sound.duration())
    );
    vinylAngle += dx * 0.01;
    lastMouseX = mouseX;
  }

  if (draggingProgress && sound.isLoaded()) {
    let p = constrain((mouseX - RIGHT_X) / 460, 0, 1);
    sound.jump(sound.duration() * p);
  }

  if (draggingKnob) {
    eq[draggingKnob] = constrain(
      eq[draggingKnob] - (mouseY - pmouseY) * 0.01,
      -1,
      1
    );
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
    setupAudioChain();
    sound.onended(onTrackEnd); // fix loop bug
    sound.play();
    isPlaying = true;
  });
}

function onTrackEnd() {
  if (loopMode) {
    sound.jump(0);
    sound.play();
  } else {
    nextTrack();
  }
}

function applyEQ() {
  lowPass.freq(map(eq.low, -1, 1, 80, 600));
  bandPass.freq(map(eq.mid, -1, 1, 600, 2500));
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
