# ✦ Virtual Dance Floor Simulation (Club Pulse 3D) ✦

A pure client-side real-time 3D simulation of an interactive nightclub dance floor built with **Three.js**, **Web Audio API**, and **Vite**.

Designed with **First-Person Exploration**, audio-reactive animated lighting, volumetric beams, intelligent spotlights, an instanced LED dance floor, and animated humanoid dancers.

---

## 📁 Modular File Architecture

Every section is separated into dedicated, decoupled modules:

| File | Purpose / Section |
| :--- | :--- |
| **`index.html`** | Application entry point, interactive audio-unlock welcome modal, in-game First-Person HUD, DJ console drawer, and Dance emote action bar. |
| **`src/main.js`** | Simulation orchestrator loop, WebGL renderer configuration, post-processing with `UnrealBloomPass` for neon glows, and window resize handling. |
| **`src/scene.js`** | Nightclub 3D architectural environment (reflective dark walls, acoustic ceiling, elevated DJ stage, turntable decks, subwoofers with pulsing speaker cones, overhead truss grid, VIP lounge bar). |
| **`src/controls.js`** | **First-Person Player Controller** with Pointer Lock, smooth mouse-look (pitch & yaw), WASD locomotion, sprint (`Shift`), jump (`Space`), head-bobbing oscillation, room boundary collisions, and seamless view switching (`V`). |
| **`src/audio.js`** | Web Audio procedural electronic music synthesizer (128 BPM 4-on-the-floor club beat with punchy kick drum, rolling sub-bass, hi-hats, claps, and arp leads) + custom audio file loader (`.mp3`/`.wav`) + FFT frequency band analysis & beat peak detection. |
| **`src/dancefloor.js`** | Instanced audio-reactive dance floor (`THREE.InstancedMesh`) with dynamic per-instance emissive colors and tile height elevation in 4 visual modes: *Bass Ripple*, *Equalizer Waves*, *Neon Spectrum*, and *Club Strobe*. |
| **`src/lighting.js`** | Animated intelligent lighting rig: 4 moving head spotlights with volumetric light cones, rotating faceted mirror disco ball with wall/floor sparkle reflections, multi-color laser array sweeps, and overhead strobe blinders. |
| **`src/avatar.js`** | Articulated humanoid avatars with hierarchical skeletal rigging (pelvis, spine, neck, arms, legs) and procedural animation routines: *Walk*, *Idle Groove*, *Fluid Wave*, *Shuffle Step*, *Breakdance Spin*, *Hype Jump*, and *Robot Pop*. |
| **`src/crowd.js`** | Autonomous club crowd simulation engine populating the floor with animated AI dancers. |
| **`src/particles.js`** | Visual FX: atmospheric club haze / dust motes catching light beams, plus physics-driven confetti cannon bursts. |
| **`src/style.css`** | Glassmorphic neon cyberpunk HUD stylesheet. |

---

## 🎮 Controls & Exploration

### Locomotion & Camera
- **Click Screen**: Lock mouse for **First-Person Look**
- **W / A / S / D** or **Arrow Keys**: Move around the dance floor and club
- **Shift**: Sprint
- **Space**: Jump
- **Mouse**: Look around (FPS pitch & yaw)
- **V**: Toggle between **First-Person View** (immersive exploration) and **Third-Person View** (view your own avatar dancing)
- **ESC**: Release mouse cursor to click DJ / lighting controls

### Dance Emotes
- **1**: Fluid Wave
- **2**: Shuffle Step
- **3**: Breakdance Spin
- **4**: Hype Jump & Fist Pump
- **5**: Robot Pop
- **🎉 Confetti Button**: Launch celebratory confetti blasts!




