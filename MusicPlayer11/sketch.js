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
let trackEnded = false; // ★新增：避免重複觸發

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
  checkTrackEnd(); // ★唯一新增呼叫
}

/* ===============================
   ★循環修正核心
================================ */

function checkTrackEnd() {
  if (
    isPlaying &&
    sound.isLoaded() &&
    !trackEnded &&
    sound.currentTime() >= sound.duration() - 0.05
  ) {
    trackEnded = true;

    if (loopMode) {
      sound.jump(0);
      sound.play();
      trackEnded = false;
    } else {
      nextTrack();
    }
  }
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
   PROGRESS
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
  text(formatTime(sound.currentTime()) + " / " + formatTime(sound.duration()), x, y + 18);
}

/* ===============================
   CONTROLS
================================ */

function drawControls() {
  let y = height - 40;
  drawBtn(520, y, "⏮");
  drawBtn(580, y, isPlaying ? "⏸" : "▶");
  drawBtn(640, y, "⏭");
  drawBtn(700, y, loopMode ? "🔁" : "➡");
}

/* ===============================
   EQ
================================ */

function drawEQ() {
  drawKnob(760, height - 60, eq.low, "LOW");
  drawKnob(820, height - 60, eq.mid, "MID");
  drawKnob(880, height - 60, eq.high, "HIGH");
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
    trackEnded = false;
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
  trackEnded = false;

  sound = loadSound(tracks[i].file, () => {
    setupAudioChain();
    sound.play();
    isPlaying = true;
  });
}

/* ===============================
   EQ APPLY
================================ */

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
