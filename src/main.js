import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { createNightclubScene } from './scene.js';
import { PlayerController } from './controls.js';
import { SoundSystem } from './audio.js';
import { DanceFloor } from './dancefloor.js';
import { LightingRig } from './lighting.js';
import { Avatar } from './avatar.js';
import { ParticleEffects } from './particles.js';
import { CrowdManager } from './crowd.js';

// 1. Core WebGL Setup
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040409);
scene.fog = new THREE.FogExp2(0x040409, 0.028);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120);

// 2. Post-Processing Bloom for Neon Glows
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.15, // strength
  0.5,  // radius
  0.78  // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// 3. Initialize Simulation Subsystems
const nightclub = createNightclubScene(scene);
const danceFloor = new DanceFloor(scene, { width: 16, depth: 16, spacing: 1.1 });
const lightingRig = new LightingRig(scene);
const soundSystem = new SoundSystem();
const particles = new ParticleEffects(scene);
const controls = new PlayerController(camera, canvas, nightclub.bounds);

let localAvatar = null;
let activeDanceEmote = 'Wave';
let selectedColorHex = '#00f3ff';

const crowd = new CrowdManager(scene, (count) => {
  const countEl = document.getElementById('player-count-num');
  if (countEl) countEl.textContent = count;
});

// 4. UI Setup and Event Handlers
function setupUI() {
  // Color Picker in Start Screen
  document.querySelectorAll('.color-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColorHex = btn.dataset.color;
    });
  });

  // Join Button (Audio unlock + First-Person Lock)
  const joinBtn = document.getElementById('join-btn');
  joinBtn.addEventListener('click', async () => {
    const nameInput = document.getElementById('player-name');
    const playerName = (nameInput.value.trim() || 'Explorer').slice(0, 16);

    // 1. Initialize & Start Audio System
    soundSystem.start();

    // 2. Create First-Person Avatar
    localAvatar = new Avatar(playerName, selectedColorHex, true);
    scene.add(localAvatar.root);

    // 3. Lock mouse pointer for First-Person Look
    canvas.requestPointerLock();

    // 4. Populate simulation crowd
    crowd.init();

    // 5. Hide Start Overlay & Reveal HUD
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    // Welcome confetti blast
    particles.fireBlast({ x: 0, y: 5, z: 0 });
  });

  // Dance Emote Buttons (1-5)
  document.querySelectorAll('.emote-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDanceEmote(btn.dataset.dance);
    });
  });

  // Keyboard Shortcuts for Dances (Keys 1 - 5)
  window.addEventListener('keydown', (e) => {
    if (['Digit1', 'Numpad1'].includes(e.code)) setDanceEmote('Wave');
    if (['Digit2', 'Numpad2'].includes(e.code)) setDanceEmote('Shuffle');
    if (['Digit3', 'Numpad3'].includes(e.code)) setDanceEmote('Breakdance');
    if (['Digit4', 'Numpad4'].includes(e.code)) setDanceEmote('Hype');
    if (['Digit5', 'Numpad5'].includes(e.code)) setDanceEmote('Robot');
  });

  // Camera Switch Button (1st person / 3rd person)
  const camBtn = document.getElementById('camera-switch-btn');
  if (camBtn) {
    camBtn.addEventListener('click', () => {
      controls.toggleCameraMode();
    });
  }

  // Confetti Button
  const cannonBtn = document.getElementById('cannon-btn');
  if (cannonBtn) {
    cannonBtn.addEventListener('click', () => {
      particles.fireBlast({
        x: controls.position.x,
        y: controls.position.y + 2.5,
        z: controls.position.z
      });
    });
  }

  // Audio Toggle (Mute/Unmute)
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isMuted = soundSystem.toggleMute();
      audioBtn.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  // DJ Drawer Toggle
  const djDrawer = document.getElementById('dj-controls-panel');
  const djToggleBtn = document.getElementById('settings-toggle-btn');
  const djCloseBtn = document.getElementById('close-dj-panel');

  if (djToggleBtn && djDrawer) {
    djToggleBtn.addEventListener('click', () => {
      djDrawer.classList.toggle('hidden');
    });
  }
  if (djCloseBtn && djDrawer) {
    djCloseBtn.addEventListener('click', () => {
      djDrawer.classList.add('hidden');
    });
  }

  // Track Selector Buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      soundSystem.setTrack(btn.dataset.track);

      const trackNames = {
        synth: 'Track: Cyber Beat (128 BPM)',
        trance: 'Track: Neon Trance Groove',
        breakbeat: 'Track: Heavy Bassline'
      };
      const label = document.getElementById('track-name');
      if (label) label.textContent = trackNames[btn.dataset.track] || 'Track: Custom';
    });
  });

  // Custom Audio File Input
  const fileInput = document.getElementById('custom-audio-file');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await soundSystem.loadCustomFile(file);
        const label = document.getElementById('track-name');
        if (label) label.textContent = `Track: ${file.name.slice(0, 22)}`;
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      }
    });
  }

  // Dance Floor Pattern Selector
  document.querySelectorAll('.floor-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.floor-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      danceFloor.setPattern(btn.dataset.pattern);
    });
  });

  // Lighting Toggles
  const laserCheck = document.getElementById('toggle-lasers');
  if (laserCheck) {
    laserCheck.addEventListener('change', (e) => {
      lightingRig.options.lasersEnabled = e.target.checked;
      lightingRig.laserGroup.visible = e.target.checked;
    });
  }

  const spotCheck = document.getElementById('toggle-spotlights');
  if (spotCheck) {
    spotCheck.addEventListener('change', (e) => {
      lightingRig.options.spotlightsEnabled = e.target.checked;
      lightingRig.spotlights.forEach((s) => {
        s.light.visible = e.target.checked;
        s.beam.visible = e.target.checked;
      });
    });
  }

  const discoCheck = document.getElementById('toggle-discoball');
  if (discoCheck) {
    discoCheck.addEventListener('change', (e) => {
      lightingRig.options.discoBallEnabled = e.target.checked;
      lightingRig.discoGroup.visible = e.target.checked;
      if (lightingRig.discoSparkles) lightingRig.discoSparkles.visible = e.target.checked;
    });
  }

  // Volume Slider
  const volSlider = document.getElementById('volume-slider');
  const volDisplay = document.getElementById('vol-display');
  if (volSlider && volDisplay) {
    volSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) / 100;
      soundSystem.setVolume(val);
      volDisplay.textContent = `${e.target.value}%`;
    });
  }
}

function setDanceEmote(danceName) {
  activeDanceEmote = danceName;
  if (localAvatar) {
    localAvatar.setDance(danceName);
  }

  // Update UI active states
  document.querySelectorAll('.emote-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.dance === danceName);
  });
}

// 5. Update HUD Equalizer Visualizer
const eqBars = document.querySelectorAll('.eq-bar');
function updateHUDEqualizer(audioData) {
  if (eqBars.length === 0 || !soundSystem.isPlaying) return;

  const heights = [
    (audioData.subBass || 0.1) * 100,
    (audioData.bass || 0.1) * 100,
    (audioData.bass * 0.8 + audioData.lowMid * 0.2) * 100,
    (audioData.lowMid || 0.1) * 100,
    (audioData.mid || 0.1) * 100,
    (audioData.mid * 0.7 + audioData.high * 0.3) * 100,
    (audioData.high || 0.1) * 100,
    (audioData.high * 1.2) * 100
  ];

  eqBars.forEach((bar, idx) => {
    const val = Math.max(15, Math.min(100, heights[idx]));
    bar.style.height = `${val}%`;
  });
}

// 6. Main Animation & Simulation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();

  // 1. Audio FFT Analysis & Beat Pulse
  const audioData = soundSystem.update();
  updateHUDEqualizer(audioData);

  // 2. Club Atmosphere & Pulsing Speakers
  nightclub.update(audioData, time);

  // 3. Audio-Reactive Dance Floor Tiles
  danceFloor.update(audioData, time);

  // 4. Moving Beams, Lasers, Disco Sparkles & Strobes
  lightingRig.update(audioData, time);

  // 5. Particles (Haze & Confetti)
  particles.update(dt, audioData);

  // 6. First-Person / Third-Person Exploration Controller
  const playerState = controls.update(dt, audioData);

  // 7. Update Local Player Avatar
  if (localAvatar) {
    localAvatar.root.position.set(
      playerState.position.x,
      0,
      playerState.position.z
    );

    if (playerState.moving) {
      localAvatar.root.rotation.y = Math.atan2(controls.direction.x, controls.direction.z);
    } else {
      localAvatar.root.rotation.y = controls.yaw + Math.PI;
    }

    if (controls.mode === 'first-person') {
      localAvatar.neck.visible = false;
      localAvatar.nameSprite.visible = false;
    } else {
      localAvatar.neck.visible = true;
      localAvatar.nameSprite.visible = true;
    }

    localAvatar.update(dt, audioData, playerState.moving, playerState.speed);
  }

  // 8. Update Autonomous Simulation Crowd
  crowd.update(dt, audioData);

  // 9. Post-Processing Bloom Render
  composer.render();
}

// 7. Window Resize Handler
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
});

// Start Simulation
setupUI();
animate();
