import * as THREE from 'three';

/**
 * Instanced Audio-Reactive Dance Floor
 * - 16x16 grid of LED tiles rendered in a single draw call via THREE.InstancedMesh
 * - Dynamic color transitions driven by FFT bands (bass, mid, high)
 * - Multiple lighting algorithms: Bass Ripple, Equalizer Bars, Rainbow Spectrum, Strobe Checker
 * - Subtle vertical elevation bounce on heavy beats
 */
export class DanceFloor {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.width = options.width || 16;
    this.depth = options.depth || 16;
    this.count = this.width * this.depth;
    this.spacing = options.spacing || 1.1; // tile spacing
    this.pattern = 'bass-ripple';

    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();

    this.createFloorMesh();
  }

  createFloorMesh() {
    // Tile Geometry: Box with bevelled look
    const tileSize = 1.0;
    const tileHeight = 0.12;
    const geometry = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);

    // Emissive-capable standard material for post-processing bloom
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x000000,
      emissiveIntensity: 0.0
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.receiveShadow = true;

    // Initialize base grid transforms and colors
    const halfW = (this.width - 1) * this.spacing * 0.5;
    const halfD = (this.depth - 1) * this.spacing * 0.5;

    let index = 0;
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const posX = x * this.spacing - halfW;
        const posZ = z * this.spacing - halfD;

        this.dummy.position.set(posX, 0.06, posZ);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();

        this.mesh.setMatrixAt(index, this.dummy.matrix);
        this.mesh.setColorAt(index, new THREE.Color(0x050510));
        index++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    this.scene.add(this.mesh);
  }

  setPattern(patternName) {
    this.pattern = patternName;
  }

  update(audioData, time) {
    if (!this.mesh) return;

    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const high = audioData.high || 0;
    const isBeat = audioData.isBeat || false;

    const halfW = (this.width - 1) * this.spacing * 0.5;
    const halfD = (this.depth - 1) * this.spacing * 0.5;
    const centerDistMax = Math.sqrt(halfW * halfW + halfD * halfD);

    let index = 0;

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const posX = x * this.spacing - halfW;
        const posZ = z * this.spacing - halfD;
        const distFromCenter = Math.sqrt(posX * posX + posZ * posZ);
        const normDist = distFromCenter / centerDistMax;

        let r = 0, g = 0, b = 0;
        let scaleY = 1.0;

        switch (this.pattern) {
          case 'bass-ripple': {
            // Concentric rings expanding outward synced with bass energy
            const wave = Math.sin(distFromCenter * 1.5 - time * 6.0) * 0.5 + 0.5;
            const intensity = wave * (0.3 + bass * 2.2);

            // Neon Cyan to Electric Magenta gradient
            const hue = (0.55 + normDist * 0.35 + time * 0.05) % 1.0;
            this.tempColor.setHSL(hue, 1.0, Math.min(0.85, intensity * 0.7));

            // Elevate tile slightly when wave passes
            scaleY = 1.0 + wave * bass * 0.7;
            break;
          }

          case 'equalizer': {
            // 2D floor equalizer where columns react to different frequencies
            const bandVal = (x / this.width < 0.33) ? bass : (x / this.width < 0.66) ? mid : high;
            const threshold = z / this.depth;
            const active = bandVal * 1.6 > threshold;

            if (active) {
              const hue = 0.33 * (1.0 - threshold); // Green to Red meter
              this.tempColor.setHSL(hue, 1.0, 0.55 + bandVal * 0.4);
              scaleY = 1.0 + bandVal * 0.5;
            } else {
              this.tempColor.setHex(0x0a0a18);
            }
            break;
          }

          case 'rainbow': {
            // Smooth rainbow wave across the entire floor
            const hue = ((posX + posZ) * 0.05 + time * 0.25) % 1.0;
            const brightness = 0.2 + bass * 0.7;
            this.tempColor.setHSL(hue, 0.95, brightness);
            scaleY = 1.0 + bass * 0.3;
            break;
          }

          case 'strobe': {
            // Checkerboard pattern flashing on the beat
            const isCheck = (x + z) % 2 === 0;
            if (isBeat) {
              this.tempColor.setHex(isCheck ? 0xffffff : 0xff0055);
              scaleY = 1.4;
            } else {
              const hue = isCheck ? 0.8 : 0.5;
              this.tempColor.setHSL(hue, 0.9, 0.15 + mid * 0.3);
            }
            break;
          }
        }

        // Apply dynamic matrix transformation for tile height/bounce
        this.dummy.position.set(posX, 0.06 * scaleY, posZ);
        this.dummy.scale.set(1.0, scaleY, 1.0);
        this.dummy.updateMatrix();

        this.mesh.setMatrixAt(index, this.dummy.matrix);
        this.mesh.setColorAt(index, this.tempColor);
        index++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
