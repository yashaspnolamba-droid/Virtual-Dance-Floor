import * as THREE from 'three';

/**
 * First-Person Player Controller:
 * - Pointer Lock & smooth FPS mouse-look (pitch & yaw)
 * - WASD locomotion with acceleration, friction, sprint [Shift], and jump [Space]
 * - Collision checking against room boundaries
 * - Natural head-bobbing oscillation while moving
 * - Optional Third-Person orbital toggle [V] to observe the player avatar dancing
 */
export class PlayerController {
  constructor(camera, domElement, bounds) {
    this.camera = camera;
    this.domElement = domElement;
    this.bounds = bounds || { minX: -14, maxX: 14, minZ: -12, maxZ: 14 };

    // Mode: 'first-person' (default) or 'third-person'
    this.mode = 'first-person';

    // Player physical representation in world
    this.position = new THREE.Vector3(0, 1.7, 8); // Eye-level at 1.7m
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Orientation
    this.pitch = 0; // vertical (up/down)
    this.yaw = Math.PI; // horizontal (looking towards DJ booth at -Z)

    // Movement Parameters
    this.walkSpeed = 5.0;
    this.sprintSpeed = 8.5;
    this.currentSpeed = this.walkSpeed;
    this.jumpForce = 6.0;
    this.gravity = 18.0;
    this.isGrounded = true;

    // Head Bobbing
    this.bobTimer = 0;
    this.bobFrequency = 10;
    this.bobAmplitude = 0.06;
    this.eyeHeight = 1.7;

    // Keys State
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    this.isLocked = false;
    this.setupPointerLock();
    this.setupKeyboard();
  }

  setupPointerLock() {
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      const crosshair = document.getElementById('crosshair');
      const tip = document.getElementById('first-person-tip');

      if (this.isLocked) {
        if (crosshair && this.mode === 'first-person') crosshair.classList.remove('hidden');
        if (tip) tip.style.opacity = '0';
      } else {
        if (tip) tip.style.opacity = '1';
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      const sensitivity = 0.0022;

      this.yaw -= movementX * sensitivity;
      this.pitch -= movementY * sensitivity;

      // Clamp vertical looking angles (no backflips)
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
          }
          break;
        case 'KeyV':
          this.toggleCameraMode();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
      }
    });
  }

  toggleCameraMode() {
    this.mode = this.mode === 'first-person' ? 'third-person' : 'first-person';
    const badge = document.getElementById('cam-mode-badge');
    const crosshair = document.getElementById('crosshair');

    if (badge) {
      badge.textContent = this.mode === 'first-person' ? 'FIRST-PERSON VIEW' : 'THIRD-PERSON VIEW';
      badge.style.color = this.mode === 'first-person' ? '#00f3ff' : '#ff007f';
      badge.style.borderColor = this.mode === 'first-person' ? '#00f3ff' : '#ff007f';
    }

    if (crosshair) {
      if (this.mode === 'third-person') {
        crosshair.classList.add('hidden');
      } else if (this.isLocked) {
        crosshair.classList.remove('hidden');
      }
    }
  }

  update(dt, audioData) {
    // 1. Calculate input motion vectors relative to camera yaw
    const forward = (this.keys.forward ? 1 : 0) - (this.keys.backward ? 1 : 0);
    const side = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const moving = forward !== 0 || side !== 0;

    this.currentSpeed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;

    // Camera forward vector projected on the horizontal XZ plane
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const fwdX = -sinYaw;
    const fwdZ = -cosYaw;
    const rightX = cosYaw;
    const rightZ = -sinYaw;

    this.direction.set(
      fwdX * forward + rightX * side,
      0,
      fwdZ * forward + rightZ * side
    );

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    // Acceleration & Deceleration damping
    const accel = 20.0;
    const targetVelX = this.direction.x * this.currentSpeed;
    const targetVelZ = this.direction.z * this.currentSpeed;

    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accel * dt);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accel * dt);

    // Gravity & Vertical Physics
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // Apply movement
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Floor contact check
    if (this.position.y <= this.eyeHeight) {
      this.position.y = this.eyeHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Clamp player within nightclub room boundaries
    this.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.position.x));
    this.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.position.z));

    // 2. Head-Bobbing calculation
    let bobOffset = 0;
    if (moving && this.isGrounded) {
      const bobFreq = this.keys.sprint ? this.bobFrequency * 1.4 : this.bobFrequency;
      this.bobTimer += dt * bobFreq;
      bobOffset = Math.sin(this.bobTimer) * this.bobAmplitude;
    } else {
      // Gentle music-synced idle sway when standing on dance floor
      this.bobTimer += dt * 3.5;
      const bassPulse = audioData ? (audioData.bass || 0) * 0.04 : 0;
      bobOffset = Math.sin(this.bobTimer) * 0.015 + bassPulse;
    }

    // 3. Update Camera position and rotation based on current mode
    if (this.mode === 'first-person') {
      this.camera.position.set(
        this.position.x,
        this.position.y + bobOffset,
        this.position.z
      );

      // Pitch and Yaw rotation for FPS camera
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = 0;
    } else {
      // Third-Person Over-the-Shoulder / Follow Camera
      const dist = 3.6;
      const height = 1.6;
      const targetX = this.position.x;
      const targetY = this.position.y - 0.4;
      const targetZ = this.position.z;

      // Position camera behind player based on yaw & pitch
      const camX = targetX + Math.sin(this.yaw) * dist * Math.cos(this.pitch);
      const camY = targetY + height + Math.sin(-this.pitch) * dist;
      const camZ = targetZ + Math.cos(this.yaw) * dist * Math.cos(this.pitch);

      this.camera.position.set(camX, Math.max(0.5, camY), camZ);
      this.camera.lookAt(targetX, targetY + 0.8, targetZ);
    }

    return {
      position: this.position,
      yaw: this.yaw,
      moving: moving,
      speed: this.velocity.length(),
      isGrounded: this.isGrounded
    };
  }
}
