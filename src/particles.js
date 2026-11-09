import * as THREE from 'three';

/**
 * Visual FX Particle Systems:
 * - Atmospheric Club Haze / Dust motes drifting through light beams
 * - Confetti Cannons firing burst cascades of colorful ribbons & flakes
 */
export class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.setupClubHaze();
    this.setupConfetti();
  }

  setupClubHaze() {
    const particleCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.hazeSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 8.0 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      this.hazeSpeeds.push({
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.08,
        vz: (Math.random() - 0.5) * 0.15
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle soft circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.5, 'rgba(180, 220, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.4
    });

    this.hazeMesh = new THREE.Points(geo, mat);
    this.scene.add(this.hazeMesh);
  }

  setupConfetti() {
    this.maxConfetti = 400;
    this.confettiGeo = new THREE.BufferGeometry();
    this.confettiPos = new Float32Array(this.maxConfetti * 3);
    this.confettiCols = new Float32Array(this.maxConfetti * 3);
    this.confettiVel = [];
    this.confettiActive = false;

    const palette = [
      new THREE.Color(0x00f3ff),
      new THREE.Color(0xff007f),
      new THREE.Color(0xffe600),
      new THREE.Color(0x00ff66),
      new THREE.Color(0x9d00ff)
    ];

    for (let i = 0; i < this.maxConfetti; i++) {
      // Inactive particles placed below floor
      this.confettiPos[i * 3] = 0;
      this.confettiPos[i * 3 + 1] = -10;
      this.confettiPos[i * 3 + 2] = 0;

      const col = palette[i % palette.length];
      this.confettiCols[i * 3] = col.r;
      this.confettiCols[i * 3 + 1] = col.g;
      this.confettiCols[i * 3 + 2] = col.b;

      this.confettiVel.push({
        x: 0,
        y: 0,
        z: 0,
        rotSpeed: 0,
        life: 0
      });
    }

    this.confettiGeo.setAttribute('position', new THREE.BufferAttribute(this.confettiPos, 3));
    this.confettiGeo.setAttribute('color', new THREE.BufferAttribute(this.confettiCols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.confettiMesh = new THREE.Points(this.confettiGeo, mat);
    this.scene.add(this.confettiMesh);
  }

  // Fire confetti blast from position (e.g. stage or player)
  fireBlast(origin = { x: 0, y: 3.5, z: -6 }) {
    for (let i = 0; i < this.maxConfetti; i++) {
      const idx = i * 3;
      this.confettiPos[idx] = origin.x + (Math.random() - 0.5) * 4;
      this.confettiPos[idx + 1] = origin.y + Math.random() * 2;
      this.confettiPos[idx + 2] = origin.z + (Math.random() - 0.5) * 4;

      const speed = 4.0 + Math.random() * 7.0;
      const angle = Math.random() * Math.PI * 2;

      this.confettiVel[i] = {
        x: Math.cos(angle) * speed,
        y: 5.0 + Math.random() * 6.0, // upward pop
        z: Math.sin(angle) * speed,
        drag: 0.96,
        life: 1.0
      };
    }

    this.confettiGeo.attributes.position.needsUpdate = true;
    this.confettiActive = true;
  }

  update(dt, audioData = {}) {
    // 1. Update Haze / Dust
    if (this.hazeMesh) {
      const pos = this.hazeMesh.geometry.attributes.position.array;
      for (let i = 0; i < this.hazeSpeeds.length; i++) {
        const idx = i * 3;
        pos[idx] += this.hazeSpeeds[i].vx * dt;
        pos[idx + 1] += this.hazeSpeeds[i].vy * dt;
        pos[idx + 2] += this.hazeSpeeds[i].vz * dt;

        // Wrap around room boundaries
        if (pos[idx] > 14) pos[idx] = -14;
        if (pos[idx] < -14) pos[idx] = 14;
        if (pos[idx + 1] > 8.5) pos[idx + 1] = 0.5;
        if (pos[idx + 1] < 0.5) pos[idx + 1] = 8.5;
        if (pos[idx + 2] > 16) pos[idx + 2] = -16;
        if (pos[idx + 2] < -16) pos[idx + 2] = 16;
      }
      this.hazeMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Confetti
    if (this.confettiActive) {
      let anyAlive = false;
      for (let i = 0; i < this.maxConfetti; i++) {
        const vel = this.confettiVel[i];
        if (vel.life <= 0) continue;

        anyAlive = true;
        const idx = i * 3;

        vel.y -= 9.8 * dt; // gravity
        vel.x *= vel.drag;
        vel.z *= vel.drag;

        this.confettiPos[idx] += vel.x * dt;
        this.confettiPos[idx + 1] += vel.y * dt;
        this.confettiPos[idx + 2] += vel.z * dt;

        // Floor collision
        if (this.confettiPos[idx + 1] <= 0.05) {
          this.confettiPos[idx + 1] = 0.05;
          vel.x = 0;
          vel.z = 0;
          vel.life -= dt * 0.4; // fade on floor
        }
      }

      this.confettiGeo.attributes.position.needsUpdate = true;
      this.confettiActive = anyAlive;
    }

    // Auto-fire confetti on heavy beat drops
    if (audioData.isBeat && audioData.bass > 0.88 && Math.random() > 0.7) {
      this.fireBlast({ x: (Math.random() - 0.5) * 6, y: 5.5, z: (Math.random() - 0.5) * 6 });
    }
  }
}
