import * as THREE from 'three';
import { Avatar } from './avatar.js';

/**
 * Autonomous Crowd Simulator
 * - Manages stylized AI club-goers dancing on the floor
 * - Controls dynamic dance routine switching, body rotation, and crowd presence
 */
export class CrowdManager {
  constructor(scene, onCountChange) {
    this.scene = scene;
    this.onCountChange = onCountChange;
    this.dancers = [];
  }

  init() {
    this.spawnCrowd();
    if (this.onCountChange) {
      this.onCountChange(this.dancers.length + 1); // +1 for the local player
    }
  }

  spawnCrowd() {
    const dancerProfiles = [
      { name: 'DJ Spark', color: '#ffe600', x: 0.0, z: -8.0, dance: 'Hype' },   // On stage
      { name: 'NeonNova', color: '#ff007f', x: -3.5, z: -2.0, dance: 'Shuffle' },
      { name: 'CyberSam', color: '#00f3ff', x: 3.0, z: -1.5, dance: 'Wave' },
      { name: 'BassQueen', color: '#9d00ff', x: -2.0, z: 3.0, dance: 'Breakdance' },
      { name: 'ElectroEcho', color: '#00ff66', x: 3.8, z: 2.5, dance: 'Robot' },
      { name: 'PixelGroove', color: '#ff3366', x: -4.5, z: 1.0, dance: 'Shuffle' },
      { name: 'VibePilot', color: '#00e5ff', x: 1.5, z: 4.2, dance: 'Wave' },
      { name: 'Solaris', color: '#ffaa00', x: -1.2, z: -4.0, dance: 'Idle' }
    ];

    dancerProfiles.forEach((profile) => {
      const dancer = new Avatar(profile.name, profile.color, false);
      dancer.root.position.set(profile.x, 0, profile.z);
      dancer.root.rotation.y = Math.random() * Math.PI * 2;
      dancer.setDance(profile.dance);

      dancer.routineTimer = Math.random() * 8 + 4;
      dancer.targetRot = dancer.root.rotation.y;

      this.scene.add(dancer.root);
      this.dancers.push(dancer);
    });
  }

  update(dt, audioData) {
    const dances = ['Wave', 'Shuffle', 'Breakdance', 'Hype', 'Robot', 'Idle'];

    this.dancers.forEach((dancer) => {
      dancer.routineTimer -= dt;

      // Periodically switch dance routines and adjust facing direction
      if (dancer.routineTimer <= 0) {
        dancer.routineTimer = Math.random() * 9 + 5;
        const nextDance = dances[Math.floor(Math.random() * dances.length)];
        dancer.setDance(nextDance);
        dancer.targetRot = dancer.root.rotation.y + (Math.random() - 0.5) * 1.6;
      }

      if (dancer.targetRot !== undefined) {
        dancer.root.rotation.y += (dancer.targetRot - dancer.root.rotation.y) * Math.min(1.0, dt * 2.5);
      }

      dancer.update(dt, audioData);
    });
  }
}
