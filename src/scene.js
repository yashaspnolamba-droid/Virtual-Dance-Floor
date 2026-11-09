import * as THREE from 'three';

/**
 * Builds the complete Nightclub 3D Environment:
 * - Architectural enclosure (walls, reflective floor border, acoustic ceiling)
 * - Elevated DJ Stage with turntable consoles & neon pulse backdrop
 * - Heavy bass subwoofer stacks with dynamic pulsing woofer cones
 * - Overhead industrial truss rig for mounting spotlights and lasers
 * - VIP lounge seating and cocktail bar
 */
export function createNightclubScene(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'NightclubEnvironment';

  // 1. Room Materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a10,
    roughness: 0.85,
    metalness: 0.2
  });

  const borderFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0x07070c,
    roughness: 0.3,
    metalness: 0.6
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x040407,
    roughness: 0.9,
    metalness: 0.1
  });

  const metalTrussMaterial = new THREE.MeshStandardMaterial({
    color: 0x222430,
    roughness: 0.4,
    metalness: 0.85
  });

  // 2. Room Geometry (Width: 32m, Length: 36m, Height: 9m)
  const ROOM_W = 32;
  const ROOM_L = 36;
  const ROOM_H = 9;

  // Outer Floor (Border surrounding the central dance floor)
  const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_L);
  const floorMesh = new THREE.Mesh(floorGeo, borderFloorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.01;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_L);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = ROOM_H;
  roomGroup.add(ceilingMesh);

  // Back Wall (Behind DJ booth at -Z)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMaterial);
  backWall.position.set(0, ROOM_H / 2, -ROOM_L / 2);
  roomGroup.add(backWall);

  // Front Wall (Behind player entrance at +Z)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMaterial);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, ROOM_H / 2, ROOM_L / 2);
  roomGroup.add(frontWall);

  // Left Wall (-X)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_H), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
  roomGroup.add(leftWall);

  // Right Wall (+X)
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_H), wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_W / 2, ROOM_H / 2, 0);
  roomGroup.add(rightWall);

  // 3. Neon Wall Strips (Cyberpunk Club Ambient Accents)
  const stripColors = [0x00f3ff, 0xff007f, 0x9d00ff];
  for (let i = 0; i < 6; i++) {
    const stripY = 2.0 + i * 1.1;
    const stripMat = new THREE.MeshBasicMaterial({
      color: stripColors[i % stripColors.length]
    });

    // Left wall strip
    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, ROOM_L * 0.7), stripMat);
    leftStrip.position.set(-ROOM_W / 2 + 0.05, stripY, 0);
    roomGroup.add(leftStrip);

    // Right wall strip
    const rightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, ROOM_L * 0.7), stripMat);
    rightStrip.position.set(ROOM_W / 2 - 0.05, stripY, 0);
    roomGroup.add(rightStrip);
  }

  // 4. Elevated DJ Stage & Console
  const stageWidth = 14;
  const stageDepth = 6;
  const stageHeight = 1.0;
  const stageGeo = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x12141c,
    roughness: 0.5,
    metalness: 0.5
  });
  const stageMesh = new THREE.Mesh(stageGeo, stageMat);
  stageMesh.position.set(0, stageHeight / 2, -ROOM_L / 2 + stageDepth / 2 + 1);
  roomGroup.add(stageMesh);

  // DJ Table / Booth
  const boothGeo = new THREE.BoxGeometry(4.5, 1.1, 1.2);
  const boothMat = new THREE.MeshStandardMaterial({
    color: 0x181a24,
    roughness: 0.3,
    metalness: 0.8
  });
  const booth = new THREE.Mesh(boothGeo, boothMat);
  booth.position.set(0, stageHeight + 1.1 / 2, -ROOM_L / 2 + stageDepth / 2 + 0.5);
  roomGroup.add(booth);

  // DJ Front Glowing LED Panel
  const djLedGeo = new THREE.PlaneGeometry(4.3, 0.9);
  const djLedMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    side: THREE.DoubleSide
  });
  const djLed = new THREE.Mesh(djLedGeo, djLedMat);
  djLed.position.set(0, stageHeight + 1.1 / 2, -ROOM_L / 2 + stageDepth / 2 + 1.11);
  roomGroup.add(djLed);

  // DJ Turntables & Mixer
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
  const vinylMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
  
  // Left and Right Decks
  [-1.2, 1.2].forEach((xPos) => {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.7), deckMat);
    deck.position.set(xPos, stageHeight + 1.14, -ROOM_L / 2 + stageDepth / 2 + 0.5);
    roomGroup.add(deck);

    const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32), vinylMat);
    platter.position.set(xPos, stageHeight + 1.18, -ROOM_L / 2 + stageDepth / 2 + 0.5);
    roomGroup.add(platter);
  });

  // DJ Mixer in Middle
  const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.7), deckMat);
  mixer.position.set(0, stageHeight + 1.14, -ROOM_L / 2 + stageDepth / 2 + 0.5);
  roomGroup.add(mixer);

  // Neon "CLUB PULSE" Sign above DJ
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sCtx = signCanvas.getContext('2d');
  sCtx.fillStyle = '#080812';
  sCtx.fillRect(0, 0, 1024, 256);
  sCtx.font = 'bold 84px sans-serif';
  sCtx.fillStyle = '#00f3ff';
  sCtx.shadowColor = '#00f3ff';
  sCtx.shadowBlur = 30;
  sCtx.textAlign = 'center';
  sCtx.fillText('★ CLUB PULSE 3D ★', 512, 140);
  sCtx.font = 'bold 36px sans-serif';
  sCtx.fillStyle = '#ff007f';
  sCtx.shadowColor = '#ff007f';
  sCtx.fillText('LIVE AUDIO-REACTIVE DANCE STAGE', 512, 200);

  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2),
    new THREE.MeshBasicMaterial({ map: signTexture, transparent: true })
  );
  signMesh.position.set(0, 6.2, -ROOM_L / 2 + 0.1);
  roomGroup.add(signMesh);

  // 5. Massive Subwoofer Speaker Stacks with Pulsing Cones
  const speakerStacks = [];
  const speakerCones = [];

  [-5.5, 5.5].forEach((xOffset) => {
    // Speaker Cabinet
    const cabGeo = new THREE.BoxGeometry(1.6, 3.2, 1.4);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x111218, roughness: 0.8 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(xOffset, 1.6, -ROOM_L / 2 + stageDepth + 0.8);
    roomGroup.add(cab);
    speakerStacks.push(cab);

    // 2 Subwoofer cones per cabinet (reactive to bass)
    [0.9, 2.3].forEach((yPos) => {
      const coneGeo = new THREE.CylinderGeometry(0.48, 0.25, 0.18, 32);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x222530,
        roughness: 0.3,
        metalness: 0.4
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(xOffset, yPos, -ROOM_L / 2 + stageDepth + 1.5);
      roomGroup.add(cone);
      speakerCones.push(cone);
    });
  });

  // 6. Overhead Industrial Metal Trusses for Rigging
  const trussHeight = 7.5;
  // Central cross truss
  const mainTrussGeo = new THREE.BoxGeometry(18, 0.4, 0.4);
  const mainTruss = new THREE.Mesh(mainTrussGeo, metalTrussMaterial);
  mainTruss.position.set(0, trussHeight, 0);
  roomGroup.add(mainTruss);

  const frontTruss = new THREE.Mesh(mainTrussGeo, metalTrussMaterial);
  frontTruss.position.set(0, trussHeight, 6);
  roomGroup.add(frontTruss);

  const backTruss = new THREE.Mesh(mainTrussGeo, metalTrussMaterial);
  backTruss.position.set(0, trussHeight, -6);
  roomGroup.add(backTruss);

  // Longitudinal connector beams
  [-8, 0, 8].forEach((xPos) => {
    const longTruss = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 16), metalTrussMaterial);
    longTruss.position.set(xPos, trussHeight, 0);
    roomGroup.add(longTruss);
  });

  // 7. VIP Bar Lounge along the Right Wall (+X)
  const barCounter = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.1, 14),
    new THREE.MeshStandardMaterial({ color: 0x141620, roughness: 0.3, metalness: 0.7 })
  );
  barCounter.position.set(ROOM_W / 2 - 3, 0.55, 0);
  roomGroup.add(barCounter);

  // Glowing neon bar foot-rail
  const barGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 14),
    new THREE.MeshBasicMaterial({ color: 0xff007f })
  );
  barGlow.position.set(ROOM_W / 2 - 4.05, 0.1, 0);
  roomGroup.add(barGlow);

  // Bar Stools
  for (let z = -5; z <= 5; z += 2.5) {
    const stoolBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16),
      metalTrussMaterial
    );
    stoolBase.position.set(ROOM_W / 2 - 4.5, 0.35, z);
    const stoolSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x330022, roughness: 0.5 })
    );
    stoolSeat.position.set(ROOM_W / 2 - 4.5, 0.75, z);
    roomGroup.add(stoolBase, stoolSeat);
  }

  // 8. Soft Club Ambient Light
  const ambientLight = new THREE.AmbientLight(0x0e0e18, 0.8);
  roomGroup.add(ambientLight);

  scene.add(roomGroup);

  return {
    roomGroup,
    speakerCones,
    djLed,
    bounds: {
      minX: -ROOM_W / 2 + 1.5,
      maxX: ROOM_W / 2 - 1.5,
      minZ: -ROOM_L / 2 + stageDepth + 2.0,
      maxZ: ROOM_L / 2 - 1.5
    },
    update: (audioData, time) => {
      // Pulse speaker cones with bass hits
      const bassScale = 1.0 + (audioData.bass || 0) * 0.45;
      speakerCones.forEach((cone) => {
        cone.scale.set(bassScale, bassScale, 1.0 + (audioData.bass || 0) * 0.8);
      });

      // Pulse DJ front LED color with mid frequencies
      if (djLed) {
        const hue = (time * 0.1) % 1;
        djLed.material.color.setHSL(hue, 1.0, 0.2 + (audioData.mid || 0) * 0.6);
      }
    }
  };
}
