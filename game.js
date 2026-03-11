(() => {
  'use strict';

  const STORAGE_KEY = 'depthrunner.bestDistanceMeters';
  const LEGACY_STORAGE_KEY = 'depthrunner.bestDepthMeters';
  const TARGET_DT = 1 / 60;
  const MAX_DELTA = 0.05;

  const ZONES = [
    {
      key: 'shallow',
      start: 0,
      end: 100,
      palette: { top: [136, 223, 255], mid: [39, 146, 198], bottom: [8, 54, 97] },
      atmosphere: 'tropical',
      obstacleTypes: ['coralBottom', 'coralTop', 'jellyfish', 'fishingNet']
    },
    {
      key: 'mid',
      start: 100,
      end: 300,
      palette: { top: [80, 160, 154], mid: [41, 98, 97], bottom: [10, 44, 66] },
      atmosphere: 'murky',
      obstacleTypes: ['shark', 'anchorChain', 'kelpTangle']
    },
    {
      key: 'deep',
      start: 300,
      end: Infinity,
      palette: { top: [18, 33, 62], mid: [7, 17, 41], bottom: [2, 6, 18] },
      atmosphere: 'abyss',
      obstacleTypes: ['anglerfish', 'thermalVent', 'pressureBand']
    }
  ];

  const app = {
    canvas: document.getElementById('game-canvas'),
    ctx: null,
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlay-title'),
    overlaySubtitle: document.getElementById('overlay-subtitle'),
    overlayStats: document.getElementById('overlay-stats'),
    overlayButton: document.getElementById('overlay-button'),
    depthValue: document.getElementById('depth-value'),
    bestValue: document.getElementById('best-value'),
    airGaugeFill: document.getElementById('air-gauge-fill'),
    airGaugeShell: document.getElementById('air-gauge-shell')
  };

  app.ctx = app.canvas.getContext('2d');

  const state = {
    game: 'start',
    nowMs: 0,
    elapsedSec: 0,
    bestDepth: loadBestDepth(),
    isNewBest: false,
    input: {
      isDivePressed: false,
      isRisePressed: false
    },
    world: {
      width: 0,
      height: 0,
      depthMeters: 0,
      runStartY: 0,
      safeStartTimer: 0,
      zone: 'shallow',
      scrollSpeed: 165,
      baseDepthRate: 16,
      spawnCooldown: 0,
      pickupCooldown: 0,
      lastSpawnY: 0,
      pressureBandCooldown: 0
    },
    diver: {
      x: 0,
      y: 0,
      width: 42,
      height: 28,
      vy: 0,
      driftRate: 0,
      riseForce: -624,
      diveForce: 624,
      drag: 0.94,
      maxRise: -360,
      maxDive: 360,
      bubbleTimer: 0,
      bubbleInterval: 0.72,
      isAlive: true
    },
    air: {
      current: 100,
      max: 100,
      baseDrainPerSecond: 2.1,
      criticalThreshold: 26
    },
    obstacles: [],
    pickups: [],
    bubbles: [],
    particles: [],
    metrics: {
      frameSamples: [],
      lastFps: 60,
      debugEnabled: false
    }
  };

  let accumulator = 0;
  let lastTs = performance.now();

  function loadBestDepth() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch (err) {
      return 0;
    }
  }

  function saveBestDepth(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(value))));
    } catch (err) {
      // Storage may be blocked; gameplay must continue.
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(window.innerWidth);
    const height = Math.floor(window.innerHeight);
    app.canvas.width = Math.floor(width * dpr);
    app.canvas.height = Math.floor(height * dpr);
    app.canvas.style.width = width + 'px';
    app.canvas.style.height = height + 'px';
    app.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.world.width = width;
    state.world.height = height;

    if (state.game !== 'playing') {
      state.diver.x = width * 0.24;
      state.diver.y = height * 0.48;
    }
  }

  function beginRun() {
    state.game = 'playing';
    state.isNewBest = false;
    state.world.depthMeters = 0;
    state.world.runStartY = state.world.height * 0.48;
    state.world.safeStartTimer = 3.6;
    state.world.zone = 'shallow';
    state.world.scrollSpeed = 165;
    state.world.spawnCooldown = 2.2;
    state.world.pickupCooldown = 1.9;
    state.world.lastSpawnY = state.world.height * 0.5;
    state.world.pressureBandCooldown = 0;

    state.diver.x = state.world.width * 0.24;
    state.diver.y = state.world.height * 0.48;
    state.diver.vy = 0;
    state.diver.bubbleTimer = 0;
    state.diver.isAlive = true;

    state.air.current = state.air.max;

    state.obstacles.length = 0;
    state.pickups.length = 0;
    state.bubbles.length = 0;
    state.particles.length = 0;

    updateOverlay();
  }

  function gameOver(reason) {
    if (state.game !== 'playing') {
      return;
    }
    state.game = 'gameOver';

    const finalDepth = Math.floor(state.world.depthMeters);
    if (finalDepth > state.bestDepth) {
      state.bestDepth = finalDepth;
      state.isNewBest = true;
      saveBestDepth(finalDepth);
    } else {
      state.isNewBest = false;
    }

    updateOverlay(reason);
  }

  function updateOverlay(reason) {
    if (state.game === 'start') {
      app.overlay.classList.add('visible');
      app.overlayTitle.textContent = 'Depth Runner';
      app.overlaySubtitle.textContent = 'W/Up rise, S/Down dive. Score is distance traveled.';
      app.overlayStats.textContent = `Best distance: ${Math.floor(state.bestDepth)}m`;
      app.overlayButton.textContent = 'Press to Begin';
      return;
    }

    if (state.game === 'gameOver') {
      app.overlay.classList.add('visible');
      app.overlayTitle.textContent = state.isNewBest ? 'New Personal Best!' : 'Dive Ended';
      app.overlaySubtitle.textContent = reason === 'air' ? 'Out of air. Surface instincts kicked in too late.' : 'You hit a hazard.';
      app.overlayStats.textContent = `Distance: ${Math.floor(state.world.depthMeters)}m | Best: ${Math.floor(state.bestDepth)}m`;
      app.overlayButton.textContent = 'Dive Again';
      return;
    }

    app.overlay.classList.remove('visible');
  }

  function setupInput() {
    const key = (event) => (event.key || '').toLowerCase();
    const isDiveKey = (event) => event.code === 'ArrowDown' || key(event) === 'arrowdown' || event.code === 'KeyS' || key(event) === 's';
    const isRiseKey = (event) => event.code === 'ArrowUp' || key(event) === 'arrowup' || event.code === 'KeyW' || key(event) === 'w';
    const isStartKey = (event) => isDiveKey(event) || isRiseKey(event) || event.code === 'Enter' || key(event) === 'enter';

    window.addEventListener('keydown', (event) => {
      if (isStartKey(event)) {
        event.preventDefault();
      }

      if (isDiveKey(event)) {
        state.input.isDivePressed = true;
      }

      if (isRiseKey(event)) {
        state.input.isRisePressed = true;
      }

      if (isStartKey(event) && state.game !== 'playing') {
        beginRun();
      }

      if (event.code === 'Backquote') {
        state.metrics.debugEnabled = !state.metrics.debugEnabled;
      }
    });

    window.addEventListener('keyup', (event) => {
      if (isDiveKey(event)) {
        state.input.isDivePressed = false;
      }

      if (isRiseKey(event)) {
        state.input.isRisePressed = false;
      }
    });

    window.addEventListener('blur', () => {
      state.input.isDivePressed = false;
      state.input.isRisePressed = false;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.input.isDivePressed = false;
        state.input.isRisePressed = false;
      }
    });

    const holdStart = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      state.input.isDivePressed = true;
      state.input.isRisePressed = false;
      if (state.game !== 'playing') {
        beginRun();
      }
    };

    const holdEnd = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      state.input.isDivePressed = false;
    };

    app.canvas.addEventListener('touchstart', holdStart, { passive: false });
    app.canvas.addEventListener('touchend', holdEnd, { passive: false });
    app.canvas.addEventListener('touchcancel', holdEnd, { passive: false });

    app.canvas.addEventListener('pointerdown', holdStart);
    app.canvas.addEventListener('pointerup', holdEnd);
    app.canvas.addEventListener('pointercancel', holdEnd);
    app.canvas.addEventListener('pointerleave', holdEnd);

    app.overlayButton.addEventListener('click', () => {
      beginRun();
      app.canvas.focus();
    });

    app.canvas.tabIndex = 0;
  }

  function getZone(depth) {
    if (depth < 100) {
      return ZONES[0];
    }
    if (depth < 300) {
      return ZONES[1];
    }
    return ZONES[2];
  }

  function zoneBlend(depth) {
    const width = 30;
    if (depth < 100 - width) {
      return { from: ZONES[0], to: ZONES[0], t: 0 };
    }
    if (depth < 100 + width) {
      return { from: ZONES[0], to: ZONES[1], t: (depth - (100 - width)) / (2 * width) };
    }
    if (depth < 300 - width) {
      return { from: ZONES[1], to: ZONES[1], t: 0 };
    }
    if (depth < 300 + width) {
      return { from: ZONES[1], to: ZONES[2], t: (depth - (300 - width)) / (2 * width) };
    }
    return { from: ZONES[2], to: ZONES[2], t: 0 };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(a, b, t) {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }

  function rgba(rgb, alpha = 1) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function getDepthMultiplier(depth) {
    const zone = getZone(depth).key;
    const zoneMult = zone === 'shallow' ? 1 : zone === 'mid' ? 1.15 : 1.35;
    const gradient = 1 + Math.min(depth / 1200, 0.35);
    return zoneMult * gradient;
  }

  function emitBreathingBubble(burst = false) {
    const diver = state.diver;
    const count = burst ? 1 + (Math.random() < 0.35 ? 1 : 0) : 1;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 6;
      const bubble = {
        x: diver.x + diver.width * 0.32 + spread,
        y: diver.y - diver.height * 0.35 + i,
        radius: 1.5 + Math.random() * 2.2,
        vy: -34 - Math.random() * 36,
        vx: (Math.random() - 0.5) * 12,
        wobble: Math.random() * Math.PI * 2,
        life: 1 + Math.random() * 0.6
      };
      state.bubbles.push(bubble);
    }
  }

  function spawnObstaclePairChance(depth) {
    if (depth < 380) {
      return 0;
    }
    return Math.min((depth - 380) / 3200, 0.07);
  }

  function getObstaclePool(depth) {
    if (depth < 90) {
      return ['jellyfish'];
    }
    if (depth < 170) {
      return ['jellyfish', 'coralBottom', 'coralTop'];
    }
    if (depth < 260) {
      return ['anchorChain', 'kelpTangle', 'shark', 'shark'];
    }
    if (depth < 300) {
      return ['shark', 'shark', 'anchorChain', 'kelpTangle'];
    }
    if (depth < 430) {
      return ['anglerfish', 'thermalVent'];
    }
    return ['anglerfish', 'thermalVent', 'pressureBand'];
  }

  function enforceCoralPassage(obstacle, worldHeight) {
    if (obstacle.type !== 'coralTop' && obstacle.type !== 'coralBottom') {
      return true;
    }

    const minGap = Math.max(145, worldHeight * 0.26);
    const nearbyCoral = state.obstacles.filter(
      (o) => Math.abs(o.x - obstacle.x) < 230 && (o.type === 'coralTop' || o.type === 'coralBottom')
    );

    const applyCoralPosition = () => {
      if (obstacle.type === 'coralTop') {
        obstacle.y = obstacle.height * 0.5;
      } else {
        obstacle.y = worldHeight - obstacle.height * 0.5;
      }
    };

    for (const other of nearbyCoral) {
      let topHeight = 0;
      let bottomHeight = 0;

      if (obstacle.type === 'coralTop') {
        topHeight = obstacle.height;
      } else if (obstacle.type === 'coralBottom') {
        bottomHeight = obstacle.height;
      }

      if (other.type === 'coralTop') {
        topHeight = Math.max(topHeight, other.height);
      } else if (other.type === 'coralBottom') {
        bottomHeight = Math.max(bottomHeight, other.height);
      }

      if (!topHeight || !bottomHeight) {
        continue;
      }

      const currentGap = worldHeight - topHeight - bottomHeight;
      if (currentGap >= minGap) {
        continue;
      }

      const neededReduction = minGap - currentGap;
      obstacle.height = Math.max(62, obstacle.height - neededReduction);
      applyCoralPosition();

      const correctedTop = obstacle.type === 'coralTop' ? obstacle.height : topHeight;
      const correctedBottom = obstacle.type === 'coralBottom' ? obstacle.height : bottomHeight;
      if (worldHeight - correctedTop - correctedBottom < minGap) {
        return false;
      }
    }

    return true;
  }

  function spawnObstacle(typeOverride = null) {
    const zone = getZone(state.world.depthMeters);
    const obstaclePool = getObstaclePool(state.world.depthMeters);
    const w = state.world.width;
    const h = state.world.height;
    const spawnX = w + 70;

    const canSpawnPressureBand = () => {
      if (state.world.pressureBandCooldown > 0) {
        return false;
      }
      const minGapPx = Math.max(460, w * 0.52);
      for (const existing of state.obstacles) {
        if (existing.type !== 'pressureBand') {
          continue;
        }
        if (existing.x + existing.width * 0.5 < state.diver.x) {
          continue;
        }
        if (Math.abs(spawnX - existing.x) < minGapPx) {
          return false;
        }
      }
      return true;
    };

    let type = typeOverride || obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
    if (type === 'pressureBand' && !canSpawnPressureBand()) {
      const withoutPressureBand = obstaclePool.filter((candidate) => candidate !== 'pressureBand');
      if (withoutPressureBand.length > 0) {
        type = withoutPressureBand[Math.floor(Math.random() * withoutPressureBand.length)];
      }
    }

    const obstacle = {
      id: `${type}-${Math.random().toString(16).slice(2)}`,
      type,
      zone: zone.key,
      x: spawnX,
      y: h * (0.2 + Math.random() * 0.6),
      width: 48,
      height: 48,
      t: 0,
      lethal: true,
      gapY: 0,
      gapH: 0,
      pulse: 0,
      period: 2.4,
      burstDuration: 1,
      motionAmp: 0
    };

    switch (type) {
      case 'coralBottom':
        obstacle.width = 56 + Math.random() * 34;
        obstacle.height = 96 + Math.random() * 130;
        obstacle.y = h - obstacle.height * 0.5;
        break;
      case 'coralTop':
        obstacle.width = 56 + Math.random() * 34;
        obstacle.height = 86 + Math.random() * 110;
        obstacle.y = obstacle.height * 0.5;
        break;
      case 'jellyfish':
        obstacle.width = 44;
        obstacle.height = 54;
        obstacle.motionAmp = 28 + Math.random() * 20;
        obstacle.baseY = 90 + Math.random() * (h - 180);
        if (state.world.depthMeters < 180) {
          const minGap = 105;
          if (Math.abs(obstacle.baseY - state.diver.y) < minGap) {
            obstacle.baseY = obstacle.baseY < state.diver.y ? Math.max(70, state.diver.y - minGap) : Math.min(h - 70, state.diver.y + minGap);
          }
        }
        obstacle.y = obstacle.baseY;
        break;
      case 'fishingNet':
        obstacle.width = 96;
        obstacle.height = h * (0.48 + Math.random() * 0.28);
        obstacle.y = h * (0.28 + Math.random() * 0.4);
        break;
      case 'shark':
        obstacle.width = 110;
        obstacle.height = 44;
        obstacle.motionAmp = 32;
        obstacle.baseY = h * (0.2 + Math.random() * 0.58);
        obstacle.y = obstacle.baseY;
        obstacle.speedBoost = 44 + Math.random() * 34;
        break;
      case 'anchorChain':
        obstacle.width = 30;
        obstacle.height = h * (0.44 + Math.random() * 0.5);
        obstacle.y = obstacle.height * 0.5;
        break;
      case 'kelpTangle':
        obstacle.width = 64;
        obstacle.height = h * (0.28 + Math.random() * 0.34);
        obstacle.y = h - obstacle.height * 0.5;
        obstacle.motionAmp = 16;
        break;
      case 'anglerfish':
        obstacle.width = 52;
        obstacle.height = 42;
        obstacle.y = h * (0.24 + Math.random() * 0.56);
        obstacle.lureRadius = 14;
        obstacle.lureOffsetX = -24;
        obstacle.lureOffsetY = -22;
        break;
      case 'thermalVent':
        obstacle.width = 68;
        obstacle.height = 72;
        obstacle.y = h - obstacle.height * 0.5;
        obstacle.period = 2 + Math.random() * 1.2;
        obstacle.burstDuration = 0.85;
        obstacle.burstHeight = h * (0.28 + Math.random() * 0.28);
        break;
      case 'pressureBand':
        obstacle.width = 132;
        obstacle.height = h;
        obstacle.y = h * 0.5;
        obstacle.gapH = 110 + Math.random() * 95;
        obstacle.gapY = 90 + Math.random() * (h - 180);
        break;
      default:
        break;
    }

    // Extra fairness in early game: keep clear vertical lane around diver.
    if (state.world.depthMeters < 180) {
      const diverY = state.diver.y;
      if (obstacle.type === 'coralBottom') {
        const maxHeight = Math.max(70, h - (diverY + 140));
        obstacle.height = Math.min(obstacle.height, maxHeight);
        obstacle.y = h - obstacle.height * 0.5;
      } else if (obstacle.type === 'coralTop') {
        const maxHeight = Math.max(70, diverY - 140);
        obstacle.height = Math.min(obstacle.height, maxHeight);
        obstacle.y = obstacle.height * 0.5;
      }
    }

    if (!enforceCoralPassage(obstacle, h)) {
      return;
    }

    state.world.lastSpawnY = obstacle.y;
    state.obstacles.push(obstacle);

    if (type === 'pressureBand') {
      // Keep cave passages well separated in time and space.
      state.world.pressureBandCooldown = 2.8;
    }

    if (Math.random() < spawnObstaclePairChance(state.world.depthMeters) && type !== 'pressureBand') {
      const followType = obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
      if (followType !== type && followType !== 'pressureBand') {
        const pair = { ...obstacle, id: `${followType}-${Math.random().toString(16).slice(2)}`, type: followType, x: obstacle.x + 140 + Math.random() * 80 };
        state.obstacles.push(pair);
      }
    }
  }

  function spawnPickup() {
    const h = state.world.height;
    const pickup = {
      id: `air-${Math.random().toString(16).slice(2)}`,
      x: state.world.width + 40,
      y: h * (0.18 + Math.random() * 0.64),
      radius: 11 + Math.random() * 5,
      vx: state.world.scrollSpeed,
      wobble: Math.random() * Math.PI * 2,
      restore: 13 + Math.random() * 9
    };
    state.pickups.push(pickup);
  }

  function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= r * r;
  }

  function diverHitbox() {
    const d = state.diver;
    return {
      x: d.x - d.width * 0.34,
      y: d.y - d.height * 0.36,
      w: d.width * 0.72,
      h: d.height * 0.72,
      cx: d.x,
      cy: d.y,
      r: Math.min(d.width, d.height) * 0.32
    };
  }

  function collidesWithObstacle(obstacle, hit) {
    const left = obstacle.x - obstacle.width * 0.5;
    const top = obstacle.y - obstacle.height * 0.5;

    if (obstacle.type === 'pressureBand') {
      const inX = hit.x + hit.w > left && hit.x < left + obstacle.width;
      const inGap = hit.y > obstacle.gapY - obstacle.gapH * 0.5 && hit.y + hit.h < obstacle.gapY + obstacle.gapH * 0.5;
      return inX && !inGap;
    }

    if (obstacle.type === 'anglerfish') {
      const bodyHit = circleHitsRect(hit.cx, hit.cy, hit.r, left, top, obstacle.width, obstacle.height);
      const lureX = obstacle.x + obstacle.lureOffsetX;
      const lureY = obstacle.y + obstacle.lureOffsetY + Math.sin(obstacle.t * 8) * 6;
      const dx = hit.cx - lureX;
      const dy = hit.cy - lureY;
      const lureHit = dx * dx + dy * dy <= Math.pow(hit.r + obstacle.lureRadius, 2);
      return bodyHit || lureHit;
    }

    if (obstacle.type === 'thermalVent') {
      const ventHit = circleHitsRect(hit.cx, hit.cy, hit.r, left, top, obstacle.width, obstacle.height);
      const cycle = obstacle.t % obstacle.period;
      const active = cycle < obstacle.burstDuration;
      if (!active) {
        return ventHit;
      }
      const burstTop = state.world.height - obstacle.burstHeight;
      const burstRect = {
        x: obstacle.x - obstacle.width * 0.2,
        y: burstTop,
        w: obstacle.width * 0.4,
        h: obstacle.burstHeight
      };
      const burstHit = circleHitsRect(hit.cx, hit.cy, hit.r, burstRect.x, burstRect.y, burstRect.w, burstRect.h);
      return ventHit || burstHit;
    }

    return circleHitsRect(hit.cx, hit.cy, hit.r, left, top, obstacle.width, obstacle.height);
  }

  function updatePlaying(dt) {
    state.elapsedSec += dt;
    state.world.safeStartTimer = Math.max(0, state.world.safeStartTimer - dt);

    state.world.scrollSpeed = 126 + Math.min(state.world.depthMeters * 0.2, 80);

    const airDrain = state.air.baseDrainPerSecond * getDepthMultiplier(state.world.depthMeters);
    state.air.current = Math.max(0, state.air.current - airDrain * dt);
    if (state.air.current <= 0) {
      gameOver('air');
      return;
    }

    state.world.spawnCooldown -= dt;
    state.world.pickupCooldown -= dt;
    state.world.pressureBandCooldown = Math.max(0, state.world.pressureBandCooldown - dt);

    if (state.world.spawnCooldown <= 0) {
      if (state.world.safeStartTimer <= 0) {
        spawnObstacle();
      }
      const base = 2 - Math.min(state.world.depthMeters / 1300, 0.85);
      const safeBuffer = state.world.safeStartTimer > 0 ? 0.9 : 0;
      state.world.spawnCooldown = Math.max(0.8, base + safeBuffer + Math.random() * 0.65);
    }

    if (state.world.pickupCooldown <= 0) {
      spawnPickup();
      state.world.pickupCooldown = 1.7 + Math.random() * 1.1;
    }

    const d = state.diver;
    const accel = d.driftRate + (state.input.isRisePressed ? d.riseForce : 0) + (state.input.isDivePressed ? d.diveForce : 0);
    d.vy += accel * dt;
    d.vy *= d.drag;
    d.vy = Math.max(d.maxRise, Math.min(d.maxDive, d.vy));
    d.y += d.vy * dt;

    const topBound = 38;
    const bottomBound = state.world.height - 38;
    if (d.y < topBound) {
      d.y = topBound;
      d.vy = 0;
    }
    if (d.y > bottomBound) {
      d.y = bottomBound;
      d.vy = 0;
    }

    // Depth model: depth is based on forward progression only.
    const forwardDepthGain = state.world.baseDepthRate + (state.world.scrollSpeed - 120) * 0.03;
    state.world.depthMeters += forwardDepthGain * dt;
    state.world.zone = getZone(state.world.depthMeters).key;

    d.bubbleTimer -= dt;
    if (d.bubbleTimer <= 0) {
      emitBreathingBubble(state.input.isDivePressed);
      d.bubbleInterval = state.input.isDivePressed ? 0.42 + Math.random() * 0.25 : 0.72 + Math.random() * 0.4;
      d.bubbleTimer = d.bubbleInterval;
    }

    for (let i = state.bubbles.length - 1; i >= 0; i--) {
      const bubble = state.bubbles[i];
      bubble.life -= dt;
      bubble.y += bubble.vy * dt;
      bubble.x += bubble.vx * dt + Math.sin((state.elapsedSec + bubble.wobble) * 5) * 6 * dt;
      bubble.radius *= 0.998;
      if (bubble.life <= 0 || bubble.y < -20 || bubble.x < -20 || bubble.x > state.world.width + 20) {
        state.bubbles.splice(i, 1);
      }
    }

    for (let i = state.pickups.length - 1; i >= 0; i--) {
      const p = state.pickups[i];
      p.x -= state.world.scrollSpeed * dt;
      p.y += Math.sin((state.elapsedSec + p.wobble) * 2.8) * 18 * dt;
      if (p.x < -40) {
        state.pickups.splice(i, 1);
        continue;
      }
      const hit = diverHitbox();
      const dx = hit.cx - p.x;
      const dy = hit.cy - p.y;
      const r = hit.r + p.radius;
      if (dx * dx + dy * dy <= r * r) {
        state.air.current = Math.min(state.air.max, state.air.current + p.restore);
        state.pickups.splice(i, 1);
      }
    }

    const hit = diverHitbox();
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obstacle = state.obstacles[i];
      obstacle.t += dt;
      obstacle.x -= (state.world.scrollSpeed + (obstacle.speedBoost || 0)) * dt;

      if (obstacle.type === 'jellyfish') {
        obstacle.y = obstacle.baseY + Math.sin(obstacle.t * 2.1) * obstacle.motionAmp;
      } else if (obstacle.type === 'shark') {
        obstacle.y = obstacle.baseY + Math.sin(obstacle.t * 1.6) * obstacle.motionAmp;
      } else if (obstacle.type === 'kelpTangle') {
        obstacle.swayX = Math.sin(obstacle.t * 2.2) * obstacle.motionAmp;
      }

      if (obstacle.x + obstacle.width < -80) {
        state.obstacles.splice(i, 1);
        continue;
      }

      if (collidesWithObstacle(obstacle, hit)) {
        gameOver('collision');
        return;
      }
    }
  }

  function drawBackground() {
    const ctx = app.ctx;
    const blend = zoneBlend(state.world.depthMeters);
    const top = lerpColor(blend.from.palette.top, blend.to.palette.top, blend.t);
    const mid = lerpColor(blend.from.palette.mid, blend.to.palette.mid, blend.t);
    const bottom = lerpColor(blend.from.palette.bottom, blend.to.palette.bottom, blend.t);

    const gradient = ctx.createLinearGradient(0, 0, 0, state.world.height);
    gradient.addColorStop(0, rgba(top));
    gradient.addColorStop(0.52, rgba(mid));
    gradient.addColorStop(1, rgba(bottom));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.world.width, state.world.height);

    const particleCount = blend.to.key === 'deep' ? 26 : blend.to.key === 'mid' ? 18 : 12;
    ctx.fillStyle = 'rgba(197, 241, 255, 0.12)';
    for (let i = 0; i < particleCount; i++) {
      const x = ((i * 97) + state.elapsedSec * (12 + i % 7) * 5) % (state.world.width + 60) - 30;
      const y = ((i * 59) + Math.sin(state.elapsedSec * 0.4 + i) * 200 + state.world.height * 0.5) % (state.world.height + 50);
      const r = 1 + ((i * 3) % 5) * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (blend.to.key === 'deep') {
      ctx.fillStyle = 'rgba(74, 216, 255, 0.2)';
      for (let i = 0; i < 8; i++) {
        const x = ((i * 167) - state.elapsedSec * 30) % (state.world.width + 220);
        const y = 70 + (i * 83) % (state.world.height - 120);
        ctx.beginPath();
        ctx.arc(x, y, 10 + Math.sin(state.elapsedSec + i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawDiver() {
    const ctx = app.ctx;
    const d = state.diver;
    const yBob = Math.sin(state.elapsedSec * 4.2) * 1;
    const x = d.x;
    const y = d.y + yBob;
    const kick = state.input.isDivePressed ? Math.sin(state.elapsedSec * 9) * 0.13 : Math.sin(state.elapsedSec * 3.5) * 0.04;
    const finKick = Math.sin(state.elapsedSec * (state.input.isDivePressed ? 13 : 6)) * 2.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(kick);

    // Back-mounted tank: compact capsule to avoid cape-like silhouette.
    ctx.fillStyle = '#708a9e';
    ctx.beginPath();
    ctx.ellipse(-14, -8, 7, 3.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8fa8b9';
    ctx.beginPath();
    ctx.ellipse(-19.5, -8, 1.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder strap
    ctx.strokeStyle = '#2a3d4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-2, 4);
    ctx.stroke();

    // Torso (horizontal swimmer profile)
    ctx.fillStyle = '#174a74';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.quadraticCurveTo(10, -13, 21, -5);
    ctx.quadraticCurveTo(23, 2, 14, 8);
    ctx.quadraticCurveTo(0, 11, -10, 4);
    ctx.quadraticCurveTo(-11, -4, -8, -10);
    ctx.closePath();
    ctx.fill();

    // Arm (forward)
    ctx.strokeStyle = '#103650';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.lineTo(14, 1);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#eeb792';
    ctx.beginPath();
    ctx.arc(23, -7, 6.2, 0, Math.PI * 2);
    ctx.fill();

    // Mask + strap
    ctx.fillStyle = '#b9ecff';
    ctx.beginPath();
    ctx.ellipse(23, -7, 5.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b425b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#24384c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -7);
    ctx.lineTo(11, -7);
    ctx.stroke();

    // Regulator + hose
    ctx.fillStyle = '#2a3845';
    ctx.beginPath();
    ctx.arc(27, -5, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a99a7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(27, -5);
    ctx.quadraticCurveTo(8, -16, -14, -9);
    ctx.stroke();

    // Trailing legs (behind body)
    ctx.strokeStyle = '#0e3551';
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.lineTo(-16, 4 + finKick * 0.35);
    ctx.moveTo(-6, 4);
    ctx.lineTo(-15, 8 - finKick * 0.35);
    ctx.stroke();

    // Fins behind legs
    ctx.fillStyle = '#31d2d8';
    ctx.beginPath();
    ctx.moveTo(-16, 4 + finKick * 0.35);
    ctx.quadraticCurveTo(-27, 8 + finKick, -31, 4 + finKick * 0.4);
    ctx.quadraticCurveTo(-22, 2 + finKick * 0.2, -16, 2 + finKick * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, 8 - finKick * 0.35);
    ctx.quadraticCurveTo(-27, 13 - finKick, -31, 9 - finKick * 0.4);
    ctx.quadraticCurveTo(-22, 7 - finKick * 0.2, -15, 6 - finKick * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = 'butt';

    ctx.restore();
  }

  function drawBubbles() {
    const ctx = app.ctx;
    for (const bubble of state.bubbles) {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(190, 244, 255, 0.48)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(232, 255, 255, 0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawPickups() {
    const ctx = app.ctx;
    for (const p of state.pickups) {
      const pulse = 1 + Math.sin(state.elapsedSec * 5 + p.wobble) * 0.12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 255, 224, 0.52)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.56, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(224, 255, 252, 0.86)';
      ctx.fill();
    }
  }

  function drawObstacle(obstacle) {
    const ctx = app.ctx;
    const x = obstacle.x;
    const y = obstacle.y;
    const w = obstacle.width;
    const h = obstacle.height;

    switch (obstacle.type) {
      case 'coralBottom':
      case 'coralTop': {
        const up = obstacle.type === 'coralBottom' ? -1 : 1;
        const baseY = obstacle.type === 'coralBottom' ? y + h * 0.5 : y - h * 0.5;

        ctx.strokeStyle = '#ef7f71';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY + up * h * 0.72);
        ctx.stroke();

        ctx.strokeStyle = '#ff9b87';
        ctx.lineWidth = 6;
        for (const branch of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(x, baseY + up * h * 0.42);
          ctx.quadraticCurveTo(
            x + branch * w * 0.2,
            baseY + up * h * 0.52,
            x + branch * w * 0.28,
            baseY + up * h * 0.7
          );
          ctx.stroke();
        }

        ctx.fillStyle = '#ffd1c8';
        for (const tip of [
          [x, baseY + up * h * 0.72],
          [x - w * 0.28, baseY + up * h * 0.7],
          [x + w * 0.28, baseY + up * h * 0.7]
        ]) {
          ctx.beginPath();
          ctx.arc(tip[0], tip[1], 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.lineCap = 'butt';
        break;
      }
      case 'jellyfish':
        ctx.fillStyle = '#ee88ff';
        ctx.beginPath();
        ctx.arc(x, y - 12, 18, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 18, y - 12, 36, 18);
        ctx.strokeStyle = '#ffd7ff';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 7, y + 6);
          ctx.lineTo(x + i * 7 + Math.sin(obstacle.t * 4 + i) * 5, y + 26 + Math.cos(obstacle.t * 3 + i) * 5);
          ctx.stroke();
        }
        break;
      case 'fishingNet':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.34);
        ctx.fillStyle = 'rgba(177, 167, 130, 0.65)';
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
        ctx.strokeStyle = 'rgba(99, 85, 54, 0.72)';
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(-w * 0.5, (h / 8) * i);
          ctx.lineTo(w * 0.5, (h / 8) * i);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo((w / 8) * i, -h * 0.5);
          ctx.lineTo((w / 8) * i, h * 0.5);
          ctx.stroke();
        }
        // Add trapped seaweed strands so it feels underwater.
        ctx.strokeStyle = 'rgba(78, 132, 94, 0.75)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 14, -h * 0.4);
          ctx.quadraticCurveTo(i * 12 + 6, 0, i * 14 - 2, h * 0.35);
          ctx.stroke();
        }
        ctx.restore();
        break;
      case 'shark':
        ctx.fillStyle = '#5e748a';
        ctx.beginPath();
        // Face left (matching right-to-left travel direction).
        ctx.moveTo(x + w * 0.5, y);
        ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.5, x - w * 0.38, y - h * 0.08);
        ctx.quadraticCurveTo(x - w * 0.52, y, x - w * 0.38, y + h * 0.08);
        ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.5, y);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(x + w * 0.48, y);
        ctx.lineTo(x + w * 0.7, y - h * 0.26);
        ctx.lineTo(x + w * 0.65, y);
        ctx.lineTo(x + w * 0.7, y + h * 0.26);
        ctx.closePath();
        ctx.fill();

        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(x + w * 0.02, y - h * 0.16);
        ctx.lineTo(x - w * 0.08, y - h * 0.62);
        ctx.lineTo(x - w * 0.16, y - h * 0.12);
        ctx.closePath();
        ctx.fill();

        // Eye and gill
        ctx.fillStyle = '#dceaf3';
        ctx.beginPath();
        ctx.arc(x - w * 0.26, y - h * 0.06, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#41586c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - w * 0.16, y - h * 0.1);
        ctx.lineTo(x - w * 0.18, y + h * 0.12);
        ctx.stroke();
        break;
      case 'anchorChain':
        ctx.strokeStyle = '#6f7c88';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        for (let i = 0; i < h; i += 20) {
          ctx.strokeStyle = i % 40 === 0 ? '#96a5b1' : '#6f7883';
          ctx.beginPath();
          ctx.arc(x, i, 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Barnacle clumps so it reads as submerged structure.
        ctx.fillStyle = 'rgba(199, 182, 146, 0.75)';
        for (let i = 24; i < h; i += 46) {
          ctx.beginPath();
          ctx.arc(x + ((i / 10) % 2 === 0 ? 7 : -7), i, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'kelpTangle':
        ctx.strokeStyle = '#2b9a68';
        ctx.lineWidth = 4;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 8, state.world.height);
          ctx.bezierCurveTo(
            x + i * 10 + (obstacle.swayX || 0),
            state.world.height - h * 0.35,
            x + i * 6 - (obstacle.swayX || 0) * 0.8,
            state.world.height - h * 0.7,
            x + i * 4,
            state.world.height - h
          );
          ctx.stroke();

          // Leaf accents
          const leafX = x + i * 8 + (obstacle.swayX || 0) * 0.35;
          const leafY = state.world.height - h * (0.35 + (i + 2) * 0.07);
          ctx.fillStyle = '#46bf86';
          ctx.beginPath();
          ctx.ellipse(leafX, leafY, 5, 2.3, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'anglerfish': {
        ctx.fillStyle = '#31374a';
        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(x - w * 0.48, y);
        ctx.lineTo(x - w * 0.68, y - h * 0.22);
        ctx.lineTo(x - w * 0.62, y);
        ctx.lineTo(x - w * 0.68, y + h * 0.22);
        ctx.closePath();
        ctx.fill();

        const lureY = y + obstacle.lureOffsetY + Math.sin(obstacle.t * 8) * 6;
        const lureX = x + obstacle.lureOffsetX;
        ctx.strokeStyle = '#9ea8bd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.quadraticCurveTo(x - 30, y - 30, lureX, lureY);
        ctx.stroke();
        const pulse = 1 + Math.sin(obstacle.t * 9) * 0.25;
        ctx.fillStyle = 'rgba(133, 240, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(lureX, lureY, obstacle.lureRadius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ecf6ff';
        ctx.beginPath();
        ctx.arc(x + w * 0.22, y - h * 0.08, 2.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'thermalVent': {
        // Chimney vent with marine tube growth accents.
        ctx.fillStyle = '#474b54';
        ctx.beginPath();
        ctx.moveTo(x - w * 0.48, y + h * 0.45);
        ctx.lineTo(x - w * 0.35, y - h * 0.45);
        ctx.lineTo(x + w * 0.35, y - h * 0.45);
        ctx.lineTo(x + w * 0.48, y + h * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8dc9b0';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(x + i * 10, y + h * 0.34, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        const cycle = obstacle.t % obstacle.period;
        const active = cycle < obstacle.burstDuration;
        if (active) {
          const burstTop = state.world.height - obstacle.burstHeight;
          const alpha = 0.4 + Math.sin(cycle * 11) * 0.2;
          ctx.fillStyle = `rgba(255, 163, 103, ${Math.max(0.2, alpha)})`;
          ctx.fillRect(x - w * 0.22, burstTop, w * 0.44, obstacle.burstHeight);
        }
        break;
      }
      case 'pressureBand':
        {
          const left = x - w * 0.5;
          const gapTop = obstacle.gapY - obstacle.gapH * 0.5;
          const gapBottom = obstacle.gapY + obstacle.gapH * 0.5;

          // Wall above and below the passage.
          ctx.fillStyle = 'rgba(20, 20, 28, 0.62)';
          ctx.fillRect(left, 0, w, gapTop);
          ctx.fillRect(left, gapBottom, w, state.world.height - gapBottom);

          ctx.fillStyle = 'rgba(120, 27, 27, 0.28)';
          ctx.fillRect(left, 0, w, gapTop);
          ctx.fillRect(left, gapBottom, w, state.world.height - gapBottom);

          // Water-colored passage through the wall.
          ctx.fillStyle = 'rgba(72, 150, 178, 0.38)';
          ctx.fillRect(left, gapTop, w, obstacle.gapH);

          // Bright rim to make the opening obvious.
          ctx.strokeStyle = 'rgba(162, 225, 243, 0.72)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(left, gapTop + 1);
          ctx.lineTo(left + w, gapTop + 1);
          ctx.moveTo(left, gapBottom - 1);
          ctx.lineTo(left + w, gapBottom - 1);
          ctx.stroke();
        }
        break;
      default:
        break;
    }
  }

  function drawObstacles() {
    for (const obstacle of state.obstacles) {
      drawObstacle(obstacle);
    }
  }

  function drawHud() {
    app.depthValue.textContent = `${Math.floor(state.world.depthMeters)}m`;
    app.bestValue.textContent = `${Math.floor(state.bestDepth)}m`;
    const pct = Math.max(0, Math.min(1, state.air.current / state.air.max));
    app.airGaugeFill.style.width = `${pct * 100}%`;
    app.airGaugeShell.setAttribute('aria-valuenow', String(Math.floor(state.air.current)));
    app.airGaugeFill.classList.toggle('critical', state.air.current <= state.air.criticalThreshold);
  }

  function drawDebug() {
    if (!state.metrics.debugEnabled) {
      return;
    }
    const ctx = app.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(7, 12, 20, 0.54)';
    ctx.fillRect(10, state.world.height - 70, 160, 58);
    ctx.fillStyle = '#cff8ff';
    ctx.font = '12px "Avenir Next", sans-serif';
    ctx.fillText(`fps: ${state.metrics.lastFps.toFixed(1)}`, 18, state.world.height - 46);
    ctx.fillText(`objects: ${state.obstacles.length + state.pickups.length + state.bubbles.length}`, 18, state.world.height - 30);
    ctx.fillText(`zone: ${state.world.zone}`, 18, state.world.height - 14);
    ctx.restore();
  }

  function updateMetrics(dt) {
    const fps = 1 / Math.max(dt, 1e-6);
    const samples = state.metrics.frameSamples;
    samples.push(fps);
    if (samples.length > 50) {
      samples.shift();
    }
    const sum = samples.reduce((acc, val) => acc + val, 0);
    state.metrics.lastFps = sum / samples.length;
  }

  function render() {
    drawBackground();
    drawPickups();
    drawObstacles();
    drawDiver();
    drawBubbles();
    drawHud();
    drawDebug();
  }

  function tick(ts) {
    const raw = (ts - lastTs) / 1000;
    const delta = Math.min(MAX_DELTA, Math.max(0, raw));
    lastTs = ts;
    accumulator += delta;

    while (accumulator >= TARGET_DT) {
      if (state.game === 'playing') {
        updatePlaying(TARGET_DT);
      }
      state.nowMs += TARGET_DT * 1000;
      accumulator -= TARGET_DT;
      updateMetrics(TARGET_DT);
    }

    render();
    requestAnimationFrame(tick);
  }

  function bootstrap() {
    resizeCanvas();
    setupInput();
    updateOverlay();
    app.bestValue.textContent = `${Math.floor(state.bestDepth)}m`;
    app.canvas.focus();
    requestAnimationFrame((ts) => {
      lastTs = ts;
      requestAnimationFrame(tick);
    });
  }

  window.addEventListener('resize', resizeCanvas);
  bootstrap();
})();
