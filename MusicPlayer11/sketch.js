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
let sound, fft;
let isPlaying = false;
let isLooping = false;

/* ===============================
   AUDIO FX (REAL EQ)
================================ */

let lowPass, midEQ, highPass;
let eq = { low: 0.5, mid: 0.5, high: 0.5 };

/* ===============================
   UI STATES
================================ */

let volume = 0.7;
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
  soundFormats('mp3');
  sound = loadSound(tracks[currentTrack].file);
}

function setup() {
  createCanvas(W, H);

  fft = new p5.FFT(0.7, 256);

  // EQ
  lowPass = new p5.LowPass();
  midEQ = new p5.EQ();
  highPass = new p5.HighPass();

  setupAudioChain();
}

function setupAudioChain() {
  sound.disconnect();
  sound.connect(lowPass);
  lowPass.connect(midEQ);
  midEQ.connect(highPass);
  highPass.connect();

  updateEQ();
  sound.setVolume(volume);
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

  for (let i = 90; i < r * 2; i += 10) {
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
  stroke(200, 200, 200, 160);
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
   TRACK INFO
================================ */

function drawTrackInfo() {
  fill(220);
  textSize(18);
  text(tracks[currentTrack].title, 420, 60);
}

/* ===============================
   PROGRESS BAR + TIME
================================ */

function drawProgress() {
  let x = 420, y = height - 80, w = 460;

  stroke(60);
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
    y - 12
  );
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
   EQ
================================ */

function drawEQ() {
  let x = 760, y = height - 60;
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
    setupAudioChain();
    sound.play();
    isPlaying = true;
  });
}

/* ===============================
   INTERACTION
================================ */

function mousePressed() {
  let cx = 240, cy = height / 2, r = 140;

  // SCRATCH
  if (dist(mouseX, mouseY, cx, cy) < r) {
    scratching = true;
    sound.pause();
    lastScrubX = mouseX;
  }

  // PROGRESS SEEK
  let barX = 420, barW = 460, barY = height - 80;
  if (mouseY > barY - 10 && mouseY < barY + 10 &&
      mouseX > barX && mouseX < barX + barW) {
    let t = sound.duration() * ((mouseX - barX) / barW);
    sound.jump(t);
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

function updateEQ() {
  lowPass.freq(map(eq.low, 0, 1, 100, 800));
  midEQ.freq(map(eq.mid, 0, 1, 800, 2500));
  highPass.freq(map(eq.high, 0, 1, 2500, 10000));
}
