const cat = document.querySelector("#cat");
const catPhoto = document.querySelector(".cat-photo");
const menu = document.querySelector("#menu");
const feedButton = document.querySelector("#feedButton");
const lickButton = document.querySelector("#lickButton");
const stretchButton = document.querySelector("#stretchButton");
const sleepButton = document.querySelector("#sleepButton");
const quitButton = document.querySelector("#quitButton");
const sizeButtons = document.querySelectorAll(".sizeButton");

window.petApi ??= {
  setClickThrough: () => {},
  quit: () => window.close()
};

const state = {
  x: 80,
  y: window.innerHeight - 455,
  size: "xlarge",
  speed: 1.5,
  direction: 1,
  mood: "walk",
  dragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  cycleStartedAt: Date.now(),
  scheduleIndex: -1,
  manualUntil: 0,
  frameIndex: 0,
  nextFrameAt: 0
};

const sizes = {
  small: { width: 170, height: 220 },
  medium: { width: 220, height: 285 },
  large: { width: 270, height: 350 },
  xlarge: { width: 320, height: 415 }
};

const cycleSchedule = [
  { mood: "idle", durationMs: 35_000 },
  { mood: "walk", durationMs: 30_000, speed: 0.45 },
  { mood: "idle", durationMs: 25_000 },
  { mood: "lick", durationMs: 12_000 },
  { mood: "idle", durationMs: 30_000 },
  { mood: "stretch", durationMs: 10_000 },
  { mood: "walk", durationMs: 25_000, speed: 0.38 },
  { mood: "sleep", durationMs: 70_000 },
  { mood: "idle", durationMs: 35_000 },
  { mood: "lick", durationMs: 12_000 },
  { mood: "idle", durationMs: 16_000 }
];

const cycleMs = cycleSchedule.reduce((total, step) => total + step.durationMs, 0);

const animations = {
  idle: {
    frames: ["./assets/cat-real.png"],
    frameMs: 1000
  },
  lick: {
    frames: Array.from(
      { length: 13 },
      (_, index) => `./assets/animations/lick-natural/lick-natural-${String(index + 1).padStart(2, "0")}.png`
    ),
    frameMs: 110
  },
  stretch: {
    frames: Array.from(
      { length: 10 },
      (_, index) => `./assets/animations/stretch/stretch-${String(index + 1).padStart(2, "0")}.png`
    ),
    frameMs: 150
  },
  sleep: {
    frames: Array.from(
      { length: 8 },
      (_, index) => `./assets/animations/sleep/sleep-${String(index + 1).padStart(2, "0")}.png`
    ),
    frameMs: 450
  }
};

["lick", "stretch", "sleep"].forEach((name) => {
  animations[name].frames.slice(0, 4).forEach((src) => {
    const image = new Image();
    image.src = src;
  });
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setMood(mood, force = false) {
  if (!force && state.mood === mood) return;

  state.mood = mood;
  cat.classList.remove("walk", "idle", "happy", "sleep", "lick", "stretch");
  cat.classList.add(mood);
  state.frameIndex = 0;
  state.nextFrameAt = 0;
  updateAnimationFrame(true);
}

function holdMood(mood, durationMs) {
  state.manualUntil = Date.now() + durationMs;
  state.scheduleIndex = -1;
  setMood(mood, true);
}

function setSize(size) {
  const nextSize = sizes[size] || sizes.xlarge;
  state.size = size;
  cat.style.width = `${nextSize.width}px`;
  cat.style.height = `${nextSize.height}px`;
  state.x = clamp(state.x, 0, window.innerWidth - nextSize.width);
  state.y = clamp(state.y, 0, window.innerHeight - nextSize.height);
  moveCat();
}

function updateAnimationFrame(force = false) {
  const animation = animations[state.mood] || animations.idle;
  if (!force && Date.now() < state.nextFrameAt) return;

  const frame = animation.frames[state.frameIndex % animation.frames.length];
  catPhoto.src = frame;
  state.frameIndex = (state.frameIndex + 1) % animation.frames.length;
  state.nextFrameAt = Date.now() + animation.frameMs;
}

function moveCat() {
  if (!state.dragging && state.mood === "walk") {
    state.x += state.speed * state.direction;

    const maxX = window.innerWidth - cat.offsetWidth;
    if (state.x <= 0 || state.x >= maxX) {
      state.direction *= -1;
      state.x = clamp(state.x, 0, maxX);
    }
  }

  cat.classList.toggle("flip", state.direction < 0);
  cat.style.left = `${state.x}px`;
  cat.style.top = `${state.y}px`;
}

function getScheduleStep(now) {
  const elapsed = (now - state.cycleStartedAt) % cycleMs;
  let cursor = 0;

  for (let index = 0; index < cycleSchedule.length; index += 1) {
    cursor += cycleSchedule[index].durationMs;
    if (elapsed < cursor) return { index, step: cycleSchedule[index] };
  }

  return { index: 0, step: cycleSchedule[0] };
}

function updateScheduledMood() {
  const now = Date.now();
  if (state.dragging || now < state.manualUntil) return;

  const { index, step } = getScheduleStep(now);
  if (state.scheduleIndex === index && state.mood === step.mood) return;

  state.scheduleIndex = index;
  state.speed = step.speed ?? state.speed;
  setMood(step.mood, true);
}

function tick() {
  updateScheduledMood();
  updateAnimationFrame();
  moveCat();
  requestAnimationFrame(tick);
}

function hideMenu() {
  menu.hidden = true;
  window.petApi.setClickThrough(true);
}

function showMenu(x, y) {
  menu.hidden = false;
  menu.style.left = `${clamp(x, 8, window.innerWidth - 110)}px`;
  menu.style.top = `${clamp(y, 8, window.innerHeight - 130)}px`;
  window.petApi.setClickThrough(false);
}

cat.addEventListener("mouseenter", () => {
  window.petApi.setClickThrough(false);
});

cat.addEventListener("mouseleave", () => {
  if (!state.dragging && menu.hidden) window.petApi.setClickThrough(true);
});

cat.addEventListener("click", () => {
  holdMood("happy", 2200);
});

cat.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  showMenu(event.clientX, event.clientY);
});

cat.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  state.dragging = true;
  state.dragOffsetX = event.clientX - state.x;
  state.dragOffsetY = event.clientY - state.y;
  cat.setPointerCapture(event.pointerId);
  window.petApi.setClickThrough(false);
});

cat.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;

  state.x = clamp(event.clientX - state.dragOffsetX, 0, window.innerWidth - cat.offsetWidth);
  state.y = clamp(event.clientY - state.dragOffsetY, 0, window.innerHeight - cat.offsetHeight);
  moveCat();
});

cat.addEventListener("pointerup", (event) => {
  state.dragging = false;
  cat.releasePointerCapture(event.pointerId);
  if (menu.hidden) window.petApi.setClickThrough(true);
});

document.addEventListener("pointerdown", (event) => {
  if (!menu.hidden && !menu.contains(event.target) && event.target !== cat) {
    hideMenu();
  }
});

feedButton.addEventListener("click", () => {
  holdMood("happy", 2600);
  hideMenu();
});

lickButton.addEventListener("click", () => {
  holdMood("lick", 12_000);
  hideMenu();
});

stretchButton.addEventListener("click", () => {
  holdMood("stretch", 10_000);
  hideMenu();
});

sleepButton.addEventListener("click", () => {
  holdMood("sleep", 70_000);
  hideMenu();
});

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSize(button.dataset.size);
    hideMenu();
  });
});

quitButton.addEventListener("click", () => {
  window.petApi.quit();
});

window.addEventListener("resize", () => {
  state.x = clamp(state.x, 0, window.innerWidth - cat.offsetWidth);
  state.y = clamp(state.y, 0, window.innerHeight - cat.offsetHeight);
});

setSize(state.size);
updateScheduledMood();
moveCat();
window.petApi.setClickThrough(true);
requestAnimationFrame(tick);
