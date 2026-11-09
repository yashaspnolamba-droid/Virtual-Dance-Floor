import * as THREE from 'three';

/**
 * Nightclub Animated Lighting Rig:
 * - 4x Intelligent Moving Head Spotlights with Volumetric Beams
 * - Rotating Mirror Disco Ball with projected sparkle dots
 * - High-speed Laser Array with sweeping fan patterns
 * - Overhead Strobe Blinders firing on bass drops
 */
export class LightingRig {
  constructor(scene) {
    this.scene = scene;
    this.spotlights = [];
    this.laserBeams = [];
    this.discoSparkles = null;
    this.strobeLight = null;

    this.options = {
      lasersEnabled: true,
      spotlightsEnabled: true,
      discoBallEnabled: true
    };

    this.setupSpotlights();
    this.setupDiscoBall();
    this.setupLasers();
    this.setupStrobe();
  }

  setupSpotlights() {
    const fixturePositions = [
      { x: -6, y: 7.4, z: -5 },
      { x: -2, y: 7.4, z: -5 },
      { x: 2, y: 7.4, z: -5 },
      { x: 6, y: 7.4, z: -5 }
    ];

    fixturePositions.forEach((pos, idx) => {
      // 1. Physical Fixture Base
      const fixtureMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.8, roughness: 0.3 })
      );
      fixtureMesh.position.set(pos.x, pos.y, pos.z);
      this.scene.add(fixtureMesh);

      // 2. Three.js Realtime Spotlight
      const spot = new THREE.SpotLight(0x00f3ff, 80, 28, Math.PI / 7, 0.45, 1.2);
      spot.position.set(pos.x, pos.y - 0.25, pos.z);
      spot.castShadow = false; // keep fast for mobile & web
      this.scene.add(spot);
      this.scene.add(spot.target);

      // 3. Volumetric Beam Cone
      // Tip translated to top (0,0,0) so the cone expands downward from the fixture
      const beamHeight = 12;
      const beamRadius = 2.4;
      const beamGeo = new THREE.ConeGeometry(beamRadius, beamHeight, 32, 1, true);
      beamGeo.translate(0, -beamHeight / 2, 0); // translate pivot to tip

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.copy(spot.position);
      this.scene.add(beamMesh);

      this.spotlights.push({
        light: spot,
        beam: beamMesh,
        fixture: fixtureMesh,
        origin: new THREE.Vector3(pos.x, pos.y - 0.25, pos.z),
        phase: idx * (Math.PI / 2),
        baseColor: new THREE.Color()
      });
    });
  }

  setupDiscoBall() {
    this.discoGroup = new THREE.Group();
    this.discoGroup.position.set(0, 6.8, 0);

    // Hanging stem rod
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
    );
    rod.position.y = 0.6;
    this.discoGroup.add(rod);

    // Faceted Mirror Sphere
    const ballGeo = new THREE.SphereGeometry(0.9, 28, 20);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xddddff,
      metalness: 0.95,
      roughness: 0.05,
      flatShading: true
    });
    this.discoBall = new THREE.Mesh(ballGeo, ballMat);
    this.discoGroup.add(this.discoBall);

    // Dynamic Sparkle Points reflected onto the environment
    const sparkleCount = 120;
    const sparkleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkleCount * 3);
    this.sparkleDirections = [];

    for (let i = 0; i < sparkleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8 + Math.random() * 8; // distance to room walls/floor

      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi) * 0.7 - 0.2, // cast more downward
        Math.sin(phi) * Math.sin(theta)
      ).normalize();

      this.sparkleDirections.push(dir);

      positions[i * 3] = dir.x * r;
      positions[i * 3 + 1] = Math.max(0.1, dir.y * r + 4);
      positions[i * 3 + 2] = dir.z * r;
    }

    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Glow dot texture for sparkles
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dctx = dotCanvas.getContext('2d');
    const grad = dctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(200, 230, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 64, 64);
    const dotTexture = new THREE.CanvasTexture(dotCanvas);

    const sparkleMat = new THREE.PointsMaterial({
      size: 0.6,
      map: dotTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffffff
    });

    this.discoSparkles = new THREE.Points(sparkleGeo, sparkleMat);
    this.scene.add(this.discoSparkles);
    this.scene.add(this.discoGroup);
  }

  setupLasers() {
    this.laserGroup = new THREE.Group();
    const laserCount = 8;
    const laserColors = [0x00ff66, 0x00f3ff, 0xff007f, 0x00ffea];

    for (let i = 0; i < laserCount; i++) {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 24)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const lineMat = new THREE.LineBasicMaterial({
        color: laserColors[i % laserColors.length],
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });

      const laser = new THREE.Line(lineGeo, lineMat);
      // Mount along back truss behind DJ
      laser.position.set((i - (laserCount - 1) / 2) * 1.8, 6.5, -12);
      this.laserGroup.add(laser);

      this.laserBeams.push({
        mesh: laser,
        originX: laser.position.x,
        originY: laser.position.y,
        originZ: laser.position.z,
        colorIndex: i,
        sweepSpeed: 1.5 + (i % 3) * 0.4,
        phase: i * 0.8
      });
    }

    this.scene.add(this.laserGroup);
  }

  setupStrobe() {
    // Overhead strobe bar for heavy bass hits
    this.strobeLight = new THREE.PointLight(0xffffff, 0, 35, 1.2);
    this.strobeLight.position.set(0, 7.8, 0);
    this.scene.add(this.strobeLight);
  }

  update(audioData, time) {
    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const high = audioData.high || 0;
    const isBeat = audioData.isBeat || false;

    // 1. Update Moving Head Spotlights
    if (this.options.spotlightsEnabled) {
      this.spotlights.forEach((item, idx) => {
        // Sweeping Lissajous curve on the dance floor
        const targetX = Math.sin(time * 1.2 + item.phase) * 6.5;
        const targetZ = Math.cos(time * 0.9 + item.phase * 1.3) * 6.0;
        const targetY = 0;

        item.light.target.position.set(targetX, targetY, targetZ);
        item.light.target.updateMatrixWorld();

        // Audio reactive intensity & dynamic neon palette
        item.light.intensity = 40 + bass * 140;
        const hue = (time * 0.1 + idx * 0.22) % 1.0;
        item.light.color.setHSL(hue, 1.0, 0.55);

        // Update volumetric beam orientation to point at target
        item.beam.material.color.copy(item.light.color);
        item.beam.material.opacity = 0.06 + bass * 0.18;

        // Orient cone from fixture to target
        const targetVec = new THREE.Vector3(targetX, targetY, targetZ);
        item.beam.lookAt(targetVec);
        item.beam.rotateX(-Math.PI / 2); // align cone tip pointing along -Y
      });
    }

    // 2. Update Disco Ball & Projected Sparkles
    if (this.options.discoBallEnabled && this.discoBall) {
      this.discoBall.rotation.y = time * 0.5;

      if (this.discoSparkles) {
        this.discoSparkles.rotation.y = time * 0.35;
        // Sparkle brightness pulses with high frequencies (hi-hats)
        this.discoSparkles.material.size = 0.4 + high * 0.8;
        this.discoSparkles.material.opacity = 0.5 + high * 0.5;
      }
    }

    // 3. Update Laser Beam Fan Arrays
    if (this.options.lasersEnabled) {
      this.laserBeams.forEach((laser) => {
        // Lasers sweep across the crowd with snappy angles
        const angleX = Math.sin(time * laser.sweepSpeed + laser.phase) * 0.45;
        const angleY = Math.cos(time * 2.0 + laser.phase) * 0.35;

        laser.mesh.rotation.x = 0.3 + angleX;
        laser.mesh.rotation.y = angleY;

        // Laser intensity reacts to mid frequencies (snares/synths)
        laser.mesh.material.opacity = 0.4 + mid * 0.6;
      });
    }

    // 4. Strobe Blinder effect
    if (this.strobeLight) {
      if (isBeat && Math.random() > 0.4) {
        this.strobeLight.intensity = 150 + bass * 100;
      } else {
        this.strobeLight.intensity *= 0.72; // quick decay
      }
    }
  }
}
