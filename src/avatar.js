import * as THREE from 'three';

/**
 * Procedural Articulated 3D Humanoid Avatar & Animation Engine
 * - Rigged hierarchical joints: Pelvis, Spine, Torso, Head, Shoulders, Arms, Hips, Legs, Feet
 * - Stylized cyber club attire with emissive neon stripes & DJ headphones
 * - Dynamic Animation Routines:
 *    * Walk (locomotion cycle)
 *    * Idle (rhythmic club head-bob & shoulder groove)
 *    * Wave (fluid liquid arm wave & chest bounce)
 *    * Shuffle (footwork shuffle & hip slides)
 *    * Breakdance (spin & freeze)
 *    * Hype (jump & fist pump)
 *    * Robot (angular pop-and-lock)
 * - Overhead 3D Canvas Nameplate Sprite
 * - Network state interpolation for remote dancers
 */
export class Avatar {
  constructor(name = 'Dancer', colorHex = '#00f3ff', isLocal = false) {
    this.name = name;
    this.colorHex = colorHex;
    this.isLocal = isLocal;

    this.root = new THREE.Group();
    this.currentDance = 'Idle';
    this.animTime = Math.random() * 10;
    this.danceBlend = 1.0;

    // Remote Interpolation Targets
    this.targetPos = new THREE.Vector3();
    this.targetRot = 0;

    this.buildCharacterMesh();
    this.addNameplate(this.name);
  }

  buildCharacterMesh() {
    const primaryColor = new THREE.Color(this.colorHex);
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x141620,
      roughness: 0.7,
      metalness: 0.3
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe6b89c,
      roughness: 0.6
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: primaryColor
    });

    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4
    });

    // --- SKELETAL HIERARCHY ---
    // Pelvis (Center of mass)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.root.add(this.pelvis);

    // Hips mesh
    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.24), darkMat);
    this.pelvis.add(hipsMesh);

    // Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.15;
    this.pelvis.add(this.spine);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.26), darkMat);
    torsoMesh.position.y = 0.24;
    this.spine.add(torsoMesh);

    // Torso Neon Accent
    const neonStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.28), glowMat);
    neonStripe.position.y = 0.32;
    this.spine.add(neonStripe);

    // Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.52;
    this.spine.add(this.neck);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), skinMat);
    headMesh.position.y = 0.18;
    this.neck.add(headMesh);

    // Cyber Visor / Glasses
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.14), glowMat);
    visorMesh.position.set(0, 0.2, 0.12);
    this.neck.add(visorMesh);

    // DJ Headphones
    const bandMesh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI), darkMat);
    bandMesh.rotation.z = Math.PI;
    bandMesh.position.y = 0.26;
    this.neck.add(bandMesh);

    [-0.15, 0.15].forEach((side) => {
      const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), glowMat);
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(side, 0.18, 0);
      this.neck.add(earCup);
    });

    // --- LEFT ARM ---
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.28, 0.44, 0);
    this.spine.add(this.leftShoulder);

    const leftArmUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), darkMat);
    leftArmUpper.position.y = -0.14;
    this.leftShoulder.add(leftArmUpper);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.y = -0.28;
    this.leftShoulder.add(this.leftElbow);

    const leftArmLower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.1), skinMat);
    leftArmLower.position.y = -0.13;
    this.leftElbow.add(leftArmLower);

    // Hand
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    leftHand.position.y = -0.28;
    this.leftElbow.add(leftHand);

    // --- RIGHT ARM ---
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.28, 0.44, 0);
    this.spine.add(this.rightShoulder);

    const rightArmUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), darkMat);
    rightArmUpper.position.y = -0.14;
    this.rightShoulder.add(rightArmUpper);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.y = -0.28;
    this.rightShoulder.add(this.rightElbow);

    const rightArmLower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.1), skinMat);
    rightArmLower.position.y = -0.13;
    this.rightElbow.add(rightArmLower);

    // Hand
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    rightHand.position.y = -0.28;
    this.rightElbow.add(rightHand);

    // --- LEFT LEG ---
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.13, -0.1, 0);
    this.pelvis.add(this.leftHip);

    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.16), darkMat);
    leftThigh.position.y = -0.2;
    this.leftHip.add(leftThigh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.y = -0.4;
    this.leftHip.add(this.leftKnee);

    const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.38, 0.14), darkMat);
    leftCalf.position.y = -0.19;
    this.leftKnee.add(leftCalf);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoesMat);
    leftFoot.position.set(0, -0.4, 0.05);
    this.leftKnee.add(leftFoot);

    // --- RIGHT LEG ---
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.13, -0.1, 0);
    this.pelvis.add(this.rightHip);

    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.16), darkMat);
    rightThigh.position.y = -0.2;
    this.rightHip.add(rightThigh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.y = -0.4;
    this.rightHip.add(this.rightKnee);

    const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.38, 0.14), darkMat);
    rightCalf.position.y = -0.19;
    this.rightKnee.add(rightCalf);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoesMat);
    rightFoot.position.set(0, -0.4, 0.05);
    this.rightKnee.add(rightFoot);
  }

  addNameplate(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Rounded background pill
    ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
    ctx.strokeStyle = this.colorHex;
    ctx.lineWidth = 4;

    const x = 12, y = 12, w = 360, h = 72, r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.nameSprite = new THREE.Sprite(spriteMat);
    this.nameSprite.scale.set(1.4, 0.35, 1);
    this.nameSprite.position.y = 2.15;
    this.root.add(this.nameSprite);
  }

  setDance(danceName) {
    if (this.currentDance !== danceName) {
      this.currentDance = danceName;
    }
  }

  update(dt, audioData = {}, isMoving = false, speed = 0) {
    this.animTime += dt;
    const t = this.animTime;
    const bass = audioData.bass || 0;

    // Reset base transforms
    this.pelvis.position.y = 0.95;
    this.pelvis.position.x = 0;
    this.pelvis.rotation.set(0, 0, 0);
    this.spine.rotation.set(0, 0, 0);
    this.neck.rotation.set(0, 0, 0);

    // If character is actively walking around in first/third person
    if (isMoving) {
      const walkFreq = speed * 1.8;
      const legAngle = Math.sin(t * walkFreq) * 0.75;

      this.leftHip.rotation.x = legAngle;
      this.rightHip.rotation.x = -legAngle;
      this.leftKnee.rotation.x = Math.max(0, -legAngle * 0.9);
      this.rightKnee.rotation.x = Math.max(0, legAngle * 0.9);

      // Arm counter-swing
      this.leftShoulder.rotation.x = -legAngle * 0.7;
      this.leftShoulder.rotation.z = -0.15;
      this.rightShoulder.rotation.x = legAngle * 0.7;
      this.rightShoulder.rotation.z = 0.15;

      this.leftElbow.rotation.x = -0.3;
      this.rightElbow.rotation.x = -0.3;

      // Vertical hip bounce
      this.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * walkFreq)) * 0.08;
      return;
    }

    // Dance Routines when stationary on the dance floor
    switch (this.currentDance) {
      case 'Wave': {
        // Fluid Arm Wave & Chest roll
        const waveRate = 4.5;
        const wave = Math.sin(t * waveRate);

        this.spine.rotation.z = Math.sin(t * waveRate * 0.5) * 0.15;
        this.spine.rotation.x = Math.cos(t * waveRate) * 0.1;
        this.neck.rotation.z = -this.spine.rotation.z;

        this.leftShoulder.rotation.z = -Math.PI / 3 + Math.sin(t * waveRate) * 0.35;
        this.leftShoulder.rotation.x = Math.cos(t * waveRate) * 0.2;
        this.leftElbow.rotation.z = -0.5 + Math.sin(t * waveRate + 1.2) * 0.5;

        this.rightShoulder.rotation.z = Math.PI / 3 + Math.sin(t * waveRate + Math.PI) * 0.35;
        this.rightElbow.rotation.z = 0.5 + Math.sin(t * waveRate + Math.PI + 1.2) * 0.5;

        this.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * waveRate)) * 0.05 + bass * 0.05;
        break;
      }

      case 'Shuffle': {
        // Fast energetic shuffle footwork and hip sways
        const shufRate = 9.0;
        const step = Math.sin(t * shufRate);

        this.leftHip.rotation.x = step * 0.6;
        this.rightHip.rotation.x = -step * 0.6;
        this.leftHip.rotation.y = step * 0.3;
        this.rightHip.rotation.y = step * 0.3;

        this.leftKnee.rotation.x = Math.max(0, -step * 0.8);
        this.rightKnee.rotation.x = Math.max(0, step * 0.8);

        this.pelvis.rotation.y = step * 0.25;
        this.pelvis.position.y = 0.95 + Math.abs(Math.sin(t * shufRate)) * 0.07 + bass * 0.08;

        this.leftShoulder.rotation.x = 0.4;
        this.leftShoulder.rotation.z = -0.3 + step * 0.15;
        this.rightShoulder.rotation.x = 0.4;
        this.rightShoulder.rotation.z = 0.3 - step * 0.15;
        this.leftElbow.rotation.x = -1.1;
        this.rightElbow.rotation.x = -1.1;
        break;
      }

      case 'Breakdance': {
        // Spin and hand-plant sweep
        const breakRate = 5.0;
        this.pelvis.rotation.y = t * breakRate;
        this.pelvis.position.y = 0.65 + Math.sin(t * breakRate * 2) * 0.12;

        this.spine.rotation.x = 0.5;
        this.leftHip.rotation.x = -0.8;
        this.leftHip.rotation.z = -0.6;
        this.rightHip.rotation.x = 0.8;
        this.rightHip.rotation.z = 0.6;

        this.leftShoulder.rotation.x = -1.4;
        this.rightShoulder.rotation.x = -1.4;
        this.leftElbow.rotation.x = -0.8;
        this.rightElbow.rotation.x = -0.8;
        break;
      }

      case 'Hype': {
        // High energy two-legged bounce and fist pumping
        const bounceRate = 8.5;
        const bounce = Math.abs(Math.sin(t * bounceRate));

        this.pelvis.position.y = 0.95 + bounce * 0.22 + bass * 0.15;
        this.leftHip.rotation.x = bounce * 0.25;
        this.rightHip.rotation.x = bounce * 0.25;
        this.leftKnee.rotation.x = bounce * 0.4;
        this.rightKnee.rotation.x = bounce * 0.4;

        // Right arm fist pumping in the air!
        this.rightShoulder.rotation.x = -Math.PI / 1.3 + Math.sin(t * bounceRate) * 0.4;
        this.rightShoulder.rotation.z = 0.2;
        this.rightElbow.rotation.x = -1.3 + Math.sin(t * bounceRate) * 0.3;

        // Left arm bent grooving
        this.leftShoulder.rotation.x = 0.3;
        this.leftShoulder.rotation.z = -0.4;
        this.leftElbow.rotation.x = -1.0;

        this.neck.rotation.x = -bounce * 0.2;
        break;
      }

      case 'Robot': {
        // Angular, stepped robotic popping
        const quant = Math.floor(t * 3.5);
        const pose = quant % 4;

        this.spine.rotation.y = (pose === 1 ? 0.35 : pose === 3 ? -0.35 : 0);
        this.leftShoulder.rotation.set(pose === 0 ? -1.5 : 0, 0, pose === 1 ? -1.5 : -0.2);
        this.rightShoulder.rotation.set(pose === 2 ? -1.5 : 0, 0, pose === 3 ? 1.5 : 0.2);
        this.leftElbow.rotation.x = (pose % 2 === 0 ? -1.57 : 0);
        this.rightElbow.rotation.x = (pose % 2 === 1 ? -1.57 : 0);

        this.pelvis.position.y = 0.95;
        break;
      }

      case 'Idle':
      default: {
        // Natural club groove synced to bass & music tempo
        const grooveRate = 4.2;
        const groove = Math.sin(t * grooveRate);

        this.pelvis.position.y = 0.95 + Math.abs(groove) * 0.05 + bass * 0.06;
        this.pelvis.rotation.y = groove * 0.1;
        this.spine.rotation.x = 0.06 + Math.abs(groove) * 0.04;
        this.neck.rotation.x = -0.08 - groove * 0.15; // head bobbing

        this.leftShoulder.rotation.x = 0.2 + groove * 0.1;
        this.leftShoulder.rotation.z = -0.25;
        this.rightShoulder.rotation.x = 0.2 - groove * 0.1;
        this.rightShoulder.rotation.z = 0.25;

        this.leftElbow.rotation.x = -0.7;
        this.rightElbow.rotation.x = -0.7;
        break;
      }
    }
  }

  // Smooth interpolation for remote multiplayer avatars
  interpolateRemote(dt) {
    if (this.isLocal) return;

    this.root.position.lerp(this.targetPos, 1 - Math.pow(0.001, dt));
    // Smooth angle interpolation
    let diff = this.targetRot - this.root.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.root.rotation.y += diff * Math.min(1.0, dt * 10);
  }
}
