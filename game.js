function shouldCellAgeOut(age, limit) {
  return limit > 0 && age > limit;
}

function nextCellAge(alive, previousAge, probability) {
  if (probability <= 0) return 0;
  return alive ? previousAge + 1 : 1;
}

const RULE_PRESETS = {
  classic: { under: 0.10, survive: 0.90, over: 0.75, birth: 0.75, noise: 0.02 },
  calm: { under: 0.00, survive: 1.00, over: 0.00, birth: 1.00, noise: 0.00 },
  chaotic: { under: 0.35, survive: 0.70, over: 0.50, birth: 0.95, noise: 0.08 }
};

function rulePresetValues(name) {
  return RULE_PRESETS[name] || null;
}

function nextZoomLevel(current, wheelDelta) {
  const direction = wheelDelta < 0 ? 1 : -1;
  const next = current + direction * 0.1;
  return Math.max(0.25, Math.min(4, Math.round(next * 100) / 100));
}

function nextPinchZoomLevel(current, startDistance, currentDistance) {
  if (startDistance <= 0) return current;
  const next = current * (currentDistance / startDistance);
  return Math.max(0.25, Math.min(4, Math.round(next * 100) / 100));
}

function clampView(zoom, panX, panY, canvasWidth, canvasHeight) {
  const scaledWidth = canvasWidth * zoom;
  const scaledHeight = canvasHeight * zoom;
  const clampedX = scaledWidth <= canvasWidth
    ? (canvasWidth - scaledWidth) / 2
    : Math.max(canvasWidth - scaledWidth, Math.min(0, panX));
  const clampedY = scaledHeight <= canvasHeight
    ? (canvasHeight - scaledHeight) / 2
    : Math.max(canvasHeight - scaledHeight, Math.min(0, panY));

  return {
    zoom,
    panX: Math.round(clampedX * 100) / 100,
    panY: Math.round(clampedY * 100) / 100
  };
}

function zoomViewAtPoint(currentZoom, nextZoom, panX, panY, anchorX, anchorY, canvasWidth, canvasHeight) {
  const relativeX = (anchorX - panX) / (canvasWidth * currentZoom);
  const relativeY = (anchorY - panY) / (canvasHeight * currentZoom);
  const nextPanX = anchorX - relativeX * canvasWidth * nextZoom;
  const nextPanY = anchorY - relativeY * canvasHeight * nextZoom;
  return clampView(nextZoom, nextPanX, nextPanY, canvasWidth, canvasHeight);
}

function dragView(zoom, panX, panY, deltaX, deltaY, canvasWidth, canvasHeight) {
  return clampView(zoom, panX + deltaX, panY + deltaY, canvasWidth, canvasHeight);
}

function screenToGridPoint(screenX, screenY, size, canvasWidth, canvasHeight, zoom, panX, panY) {
  return {
    x: Math.floor(((screenX - panX) / (canvasWidth * zoom)) * size),
    y: Math.floor(((screenY - panY) / (canvasHeight * zoom)) * size)
  };
}

function shouldDrawGuideGrid(cellWidth, cellHeight) {
  return Math.min(cellWidth, cellHeight) >= 6;
}

function visibleGridLineRange(start, cellSize, totalCells, viewportSize) {
  if (cellSize <= 0 || totalCells <= 0 || viewportSize <= 0) {
    return { first: 0, last: 0 };
  }

  const first = Math.max(0, Math.floor((-start) / cellSize));
  const last = Math.min(totalCells, Math.ceil((viewportSize - start) / cellSize));
  return { first, last };
}

function keyboardShortcutAction(key) {
  const shortcuts = {
    ' ': 'play',
    c: 'clear',
    i: 'invert',
    r: 'randomise',
    s: 'step'
  };

  return shortcuts[String(key).toLowerCase()] || null;
}

function invertProbabilityGrid(values, ageValues) {
  for (let i = 0; i < values.length; i++) {
    values[i] = 1 - values[i];
    ageValues[i] = values[i] > 0 ? Math.max(1, ageValues[i]) : 0;
  }
}

function hslToRgb(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = Math.max(0, Math.min(1, saturation));
  const l = Math.max(0, Math.min(1, lightness));

  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey };
  }

  const hueToRgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255)
  };
}

const RAINBOW_COLOURS = [
  { r: 228, g: 3, b: 3 },
  { r: 255, g: 140, b: 0 },
  { r: 255, g: 237, b: 0 },
  { r: 0, g: 128, b: 38 },
  { r: 0, g: 77, b: 255 },
  { r: 117, g: 7, b: 135 },
  { r: 143, g: 0, b: 255 }
];

function rainbowCellColour(cellIndex, generation) {
  return RAINBOW_COLOURS[(cellIndex + generation) % RAINBOW_COLOURS.length];
}

function liveCellColour(cellIndex, generation, discoMode, fallbackColour) {
  return discoMode ? rainbowCellColour(cellIndex, generation) : fallbackColour;
}

function visibleCellProbability(probability, discoMode) {
  const p = Math.max(0, Math.min(1, probability));
  return discoMode && p < 0.1 ? 0 : p;
}

function patternCells(pattern, size) {
  const mid = Math.floor(size / 2);
  const patterns = {
    glider: [[0, -1], [1, 0], [-1, 1], [0, 1], [1, 1]],
    blinker: [[-1, 0], [0, 0], [1, 0]],
    toad: [[0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0]],
    pulsar: [
      [-4, -6], [-3, -6], [-2, -6], [2, -6], [3, -6], [4, -6],
      [-6, -4], [-1, -4], [1, -4], [6, -4],
      [-6, -3], [-1, -3], [1, -3], [6, -3],
      [-6, -2], [-1, -2], [1, -2], [6, -2],
      [-4, -1], [-3, -1], [-2, -1], [2, -1], [3, -1], [4, -1],
      [-4, 1], [-3, 1], [-2, 1], [2, 1], [3, 1], [4, 1],
      [-6, 2], [-1, 2], [1, 2], [6, 2],
      [-6, 3], [-1, 3], [1, 3], [6, 3],
      [-6, 4], [-1, 4], [1, 4], [6, 4],
      [-4, 6], [-3, 6], [-2, 6], [2, 6], [3, 6], [4, 6]
    ],
    beacon: [[-2, -2], [-1, -2], [-2, -1], [1, 1], [2, 1], [1, 2], [2, 2]]
  };

  return (patterns[pattern] || [])
    .map(([x, y]) => ({ x: mid + x, y: mid + y }))
    .filter(({ x, y }) => x >= 0 && x < size && y >= 0 && y < size);
}

function blendLiveCellColour(probability, liveColour, discoMode = false) {
  const p = visibleCellProbability(probability, discoMode);
  return {
    r: Math.round(255 * (1 - p) + liveColour.r * p),
    g: Math.round(255 * (1 - p) + liveColour.g * p),
    b: Math.round(255 * (1 - p) + liveColour.b * p)
  };
}

function populationPercent(liveCount, totalCells) {
  if (totalCells <= 0) return '0.0%';
  return `${((liveCount / totalCells) * 100).toFixed(1)}%`;
}

if (typeof document !== 'undefined') (() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);

  const controls = {
    play: $('play'),
    step: $('step'),
    randomise: $('randomise'),
    invert: $('invert'),
    clear: $('clear'),
    paintMode: $('paintMode'),
    eraseMode: $('eraseMode'),
    zoomIn: $('zoomIn'),
    zoomOut: $('zoomOut'),
    resetView: $('resetView'),
    panel: $('controlsPanel'),
    controlsToggle: $('controlsToggle'),
    gridSize: $('gridSize'),
    ageLimit: $('ageLimit'),
    density: $('density'),
    patternPreset: $('patternPreset'),
    rulePreset: $('rulePreset'),
    hue: $('hue'),
    saturation: $('saturation'),
    discoMode: $('discoMode'),
    speed: $('speed'),
    under: $('under'),
    survive: $('survive'),
    over: $('over'),
    birth: $('birth'),
    noise: $('noise')
  };

  const labels = {
    generation: $('generation'),
    average: $('average'),
    liveCount: $('liveCount'),
    livePercent: $('livePercent'),
    zoomLevel: $('zoomLevel'),
    runStatus: $('runStatus'),
    gridSize: $('gridSizeValue'),
    ageLimit: $('ageLimitValue'),
    density: $('densityValue'),
    patternPreset: $('patternPresetValue'),
    rulePreset: $('rulePresetValue'),
    hue: $('hueValue'),
    saturation: $('saturationValue'),
    discoMode: $('discoModeValue'),
    speed: $('speedValue'),
    under: $('underValue'),
    survive: $('surviveValue'),
    over: $('overValue'),
    birth: $('birthValue'),
    noise: $('noiseValue')
  };

  let size = Number(controls.gridSize.value);
  let grid = new Float32Array(size * size);
  let next = new Float32Array(size * size);
  let collapsed = new Uint8Array(size * size);
  let ages = new Uint16Array(size * size);
  let nextAges = new Uint16Array(size * size);
  let generation = 0;
  let running = false;
  let lastTick = 0;
  let isDrawing = false;
  let tool = 'paint';
  let drawQueued = false;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let controlsCollapsed = false;
  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let pinchStartPanX = 0;
  let pinchStartPanY = 0;
  let pinchStartMidpoint = { x: 0, y: 0 };

  const bufferCanvas = document.createElement('canvas');
  const bufferCtx = bufferCanvas.getContext('2d', { alpha: false });
  let image = null;

  function resizeBuffers(newSize) {
    size = newSize;
    grid = new Float32Array(size * size);
    next = new Float32Array(size * size);
    collapsed = new Uint8Array(size * size);
    ages = new Uint16Array(size * size);
    nextAges = new Uint16Array(size * size);
    bufferCanvas.width = size;
    bufferCanvas.height = size;
    image = bufferCtx.createImageData(size, size);
  }

  function resizeCanvasToWindow() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      const camera = clampView(zoom, panX, panY, canvas.width, canvas.height);
      zoom = camera.zoom;
      panX = camera.panX;
      panY = camera.panY;
    }

    requestDraw();
  }

  function idx(x, y) {
    return y * size + x;
  }

  function clamp(v) {
    return Math.max(0, Math.min(1, v));
  }

  function seedVisiblePattern() {
    grid.fill(0);
    ages.fill(0);
    const mid = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - mid;
        const dy = y - mid;
        const d = Math.sqrt(dx * dx + dy * dy);
        const i = idx(x, y);

        if (d < size * 0.18) {
          grid[i] = 0.85;
          ages[i] = 1;
        } else if (d < size * 0.28) {
          grid[i] = 0.45;
          ages[i] = 1;
        } else if (Math.random() < 0.04) {
          grid[i] = Math.random() * 0.8;
          ages[i] = 1;
        }
      }
    }

    generation = 0;
    requestDraw();
  }

  function randomise() {
    grid.fill(0);
    ages.fill(0);

    const density = Number(controls.density.value);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < density ? Math.random() : 0;
      ages[i] = grid[i] > 0 ? 1 : 0;
    }

    generation = 0;
    requestDraw();
  }

  function collapse() {
    for (let i = 0; i < grid.length; i++) {
      collapsed[i] = Math.random() < grid[i] ? 1 : 0;
    }
  }

  function neighbours(x, y) {
    let n = 0;

    for (let dy = -1; dy <= 1; dy++) {
      const yy = (y + dy + size) % size;

      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const xx = (x + dx + size) % size;
        n += collapsed[idx(xx, yy)];
      }
    }

    return n;
  }

  function step() {
    collapse();

    const under = Number(controls.under.value);
    const survive = Number(controls.survive.value);
    const over = Number(controls.over.value);
    const birth = Number(controls.birth.value);
    const noise = Number(controls.noise.value);
    const ageLimit = Number(controls.ageLimit.value);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = idx(x, y);
        const alive = collapsed[i] === 1;
        const age = alive ? ages[i] + 1 : 0;
        const n = neighbours(x, y);
        let p = noise * Math.random();

        if (shouldCellAgeOut(age, ageLimit)) {
          p = 0;
        } else if (alive && n < 2) p = under;
        else if (alive && (n === 2 || n === 3)) p = survive;
        else if (alive && n > 3) p = over;
        else if (!alive && n === 3) p = birth;

        next[i] = clamp(p);
        nextAges[i] = nextCellAge(alive, ages[i], p);
      }
    }

    [grid, next] = [next, grid];
    [ages, nextAges] = [nextAges, ages];
    generation++;
    requestDraw();
  }

  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(draw);
  }

  function draw() {
    drawQueued = false;

    const pixels = image.data;
    let total = 0;
    let liveCount = 0;

    const selectedLiveColour = hslToRgb(Number(controls.hue.value), Number(controls.saturation.value) / 100, 0.45);
    const discoMode = controls.discoMode.checked;

    for (let i = 0; i < grid.length; i++) {
      const p = grid[i];
      const colour = blendLiveCellColour(p, liveCellColour(i, generation, discoMode, selectedLiveColour), discoMode);
      const o = i * 4;

      total += p;
      if (p >= 0.5) liveCount++;
      pixels[o] = colour.r;
      pixels[o + 1] = colour.g;
      pixels[o + 2] = colour.b;
      pixels[o + 3] = 255;
    }

    bufferCtx.putImageData(image, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawWidth = canvas.width * zoom;
    const drawHeight = canvas.height * zoom;

    ctx.drawImage(bufferCanvas, panX, panY, drawWidth, drawHeight);
    drawGuideGrid();

    labels.generation.textContent = generation;
    labels.average.textContent = (total / grid.length).toFixed(3);
    labels.liveCount.textContent = liveCount;
    labels.livePercent.textContent = populationPercent(liveCount, grid.length);
    labels.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    labels.runStatus.textContent = running ? 'Running' : 'Paused';
    updateLabels();
  }

  function drawGuideGrid() {
    const cellX = (canvas.width * zoom) / size;
    const cellY = (canvas.height * zoom) / size;
    if (!shouldDrawGuideGrid(cellX, cellY)) return;

    const startX = panX;
    const startY = panY;

    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;

    const visibleX = visibleGridLineRange(startX, cellX, size, canvas.width);
    const visibleY = visibleGridLineRange(startY, cellY, size, canvas.height);

    for (let i = visibleX.first; i <= visibleX.last; i++) {
      const x = Math.round(startX + i * cellX) + 0.5;

      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, startY));
      ctx.lineTo(x, Math.min(canvas.height, startY + canvas.height * zoom));
      ctx.stroke();
    }

    for (let i = visibleY.first; i <= visibleY.last; i++) {
      const y = Math.round(startY + i * cellY) + 0.5;

      ctx.beginPath();
      ctx.moveTo(Math.max(0, startX), y);
      ctx.lineTo(Math.min(canvas.width, startX + canvas.width * zoom), y);
      ctx.stroke();
    }
  }

  function updateLabels() {
    labels.gridSize.textContent = `${size} × ${size}`;
    labels.ageLimit.textContent = controls.ageLimit.value === '0' ? 'never' : `${controls.ageLimit.value} gen`;
    labels.density.textContent = `${Math.round(Number(controls.density.value) * 100)}%`;
    labels.patternPreset.textContent = controls.patternPreset.value || 'none';
    labels.rulePreset.textContent = controls.rulePreset.value || 'custom';
    labels.hue.textContent = `${controls.hue.value}°`;
    labels.saturation.textContent = `${controls.saturation.value}%`;
    labels.discoMode.textContent = controls.discoMode.checked ? 'on' : 'off';
    labels.speed.textContent = `${controls.speed.value} gen/s`;

    for (const key of ['under', 'survive', 'over', 'birth', 'noise']) {
      labels[key].textContent = Number(controls[key].value).toFixed(2);
    }
  }

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const screenX = ((e.clientX - r.left) / r.width) * canvas.width;
    const screenY = ((e.clientY - r.top) / r.height) * canvas.height;
    return screenToGridPoint(screenX, screenY, size, canvas.width, canvas.height, zoom, panX, panY);
  }

  function paint(e) {
    const p = canvasPoint(e);
    if (p.x < 0 || p.x >= size || p.y < 0 || p.y >= size) return;

    const i = idx(p.x, p.y);
    grid[i] = tool === 'erase' ? 0 : 1;
    ages[i] = tool === 'erase' ? 0 : 1;
    requestDraw();
  }

  function setTool(t) {
    tool = t;
    controls.paintMode.classList.toggle('primary', t === 'paint');
    controls.eraseMode.classList.toggle('primary', t === 'erase');
  }

  function setControlsCollapsed(collapsed) {
    controlsCollapsed = collapsed;
    controls.panel.classList.toggle('collapsed', controlsCollapsed);
    controls.controlsToggle.textContent = controlsCollapsed ? 'Show controls' : 'Hide controls';
    controls.controlsToggle.setAttribute('aria-expanded', String(!controlsCollapsed));
  }

  function resetView() {
    const camera = clampView(1, 0, 0, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    requestDraw();
  }

  function togglePlay() {
    running = !running;
    controls.play.textContent = running ? 'Pause' : 'Play';
    controls.play.classList.toggle('primary', !running);
    labels.runStatus.textContent = running ? 'Running' : 'Paused';
  }

  function clearGrid() {
    grid.fill(0);
    ages.fill(0);
    generation = 0;
    requestDraw();
  }

  function invertGrid() {
    invertProbabilityGrid(grid, ages);
    generation = 0;
    requestDraw();
  }

  function applyPattern(pattern) {
    if (pattern === 'random-soup') {
      randomise();
      return;
    }

    const cells = patternCells(pattern, size);
    if (!cells.length) return;

    grid.fill(0);
    ages.fill(0);
    for (const { x, y } of cells) {
      const i = idx(x, y);
      grid[i] = 1;
      ages[i] = 1;
    }

    generation = 0;
    requestDraw();
  }

  function applyRulePreset(name) {
    const preset = rulePresetValues(name);
    if (!preset) return;

    for (const [key, value] of Object.entries(preset)) {
      controls[key].value = value.toFixed(2);
    }

    updateLabels();
    requestDraw();
  }

  function applyZoomDelta(delta) {
    const nextZoom = Math.max(0.25, Math.min(4, Math.round((zoom + delta) * 100) / 100));
    const camera = zoomViewAtPoint(zoom, nextZoom, panX, panY, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    requestDraw();
  }

  function toCanvasPoint(point) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((point.clientX - r.left) / r.width) * canvas.width,
      y: ((point.clientY - r.top) / r.height) * canvas.height
    };
  }

  function pointerMidpoint() {
    const points = [...activePointers.values()].map(toCanvasPoint);
    if (points.length < 2) return { x: 0, y: 0 };

    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2
    };
  }

  function pointerDistance() {
    const points = [...activePointers.values()];
    if (points.length < 2) return 0;

    const dx = points[0].clientX - points[1].clientX;
    const dy = points[0].clientY - points[1].clientY;
    return Math.hypot(dx, dy);
  }

  function capturePointer(pointerId) {
    try {
      canvas.setPointerCapture?.(pointerId);
    } catch {
      // Synthetic browser tests and some mobile browsers can reject capture.
      // Pointer tracking still works because we keep active pointer positions.
    }
  }

  function releasePointer(pointerId) {
    try {
      canvas.releasePointerCapture?.(pointerId);
    } catch {
      // See capturePointer.
    }
  }

  function loop(ts) {
    if (running) {
      const interval = 1000 / Number(controls.speed.value);
      if (ts - lastTick >= interval) {
        step();
        lastTick = ts;
      }
    }

    requestAnimationFrame(loop);
  }

  controls.play.addEventListener('click', togglePlay);

  controls.step.addEventListener('click', step);
  controls.randomise.addEventListener('click', randomise);
  controls.invert.addEventListener('click', invertGrid);
  controls.clear.addEventListener('click', clearGrid);
  controls.paintMode.addEventListener('click', () => setTool('paint'));
  controls.eraseMode.addEventListener('click', () => setTool('erase'));
  controls.zoomIn.addEventListener('click', () => applyZoomDelta(0.2));
  controls.zoomOut.addEventListener('click', () => applyZoomDelta(-0.2));
  controls.resetView.addEventListener('click', resetView);
  controls.controlsToggle.addEventListener('click', () => setControlsCollapsed(!controlsCollapsed));
  controls.gridSize.addEventListener('input', () => {
    resizeBuffers(Number(controls.gridSize.value));
    seedVisiblePattern();
  });
  controls.patternPreset.addEventListener('change', () => {
    applyPattern(controls.patternPreset.value);
    updateLabels();
  });
  controls.rulePreset.addEventListener('change', () => {
    applyRulePreset(controls.rulePreset.value);
  });

  for (const key of ['ageLimit', 'density', 'hue', 'saturation', 'discoMode', 'speed', 'under', 'survive', 'over', 'birth', 'noise']) {
    controls[key].addEventListener('input', () => {
      if (['under', 'survive', 'over', 'birth', 'noise'].includes(key)) {
        controls.rulePreset.value = '';
      }
      updateLabels();
      requestDraw();
    });
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    activePointers.set(e.pointerId, e);
    capturePointer(e.pointerId);

    if (activePointers.size >= 2) {
      isDrawing = false;
      pinchStartDistance = pointerDistance();
      pinchStartZoom = zoom;
      pinchStartPanX = panX;
      pinchStartPanY = panY;
      pinchStartMidpoint = pointerMidpoint();
      return;
    }

    isDrawing = true;
    paint(e);
  }, { passive: false });

  canvas.addEventListener('pointermove', e => {
    if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, e);

    if (activePointers.size >= 2) {
      e.preventDefault();
      const currentMidpoint = pointerMidpoint();
      const nextZoom = nextPinchZoomLevel(pinchStartZoom, pinchStartDistance, pointerDistance());
      const zoomed = zoomViewAtPoint(pinchStartZoom, nextZoom, pinchStartPanX, pinchStartPanY, pinchStartMidpoint.x, pinchStartMidpoint.y, canvas.width, canvas.height);
      const dragged = dragView(zoomed.zoom, zoomed.panX, zoomed.panY, currentMidpoint.x - pinchStartMidpoint.x, currentMidpoint.y - pinchStartMidpoint.y, canvas.width, canvas.height);
      zoom = dragged.zoom;
      panX = dragged.panX;
      panY = dragged.panY;
      requestDraw();
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();
    paint(e);
  }, { passive: false });

  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    activePointers.delete(e.pointerId);
    isDrawing = false;
    releasePointer(e.pointerId);
  }, { passive: false });

  canvas.addEventListener('pointercancel', e => {
    activePointers.delete(e.pointerId);
    isDrawing = false;
    releasePointer(e.pointerId);
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const anchorX = ((e.clientX - r.left) / r.width) * canvas.width;
    const anchorY = ((e.clientY - r.top) / r.height) * canvas.height;
    const nextZoom = nextZoomLevel(zoom, e.deltaY);
    const camera = zoomViewAtPoint(zoom, nextZoom, panX, panY, anchorX, anchorY, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    requestDraw();
  }, { passive: false });

  window.addEventListener('resize', resizeCanvasToWindow);
  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) return;

    const action = keyboardShortcutAction(e.key);
    if (!action) return;

    e.preventDefault();
    if (action === 'play') togglePlay();
    else if (action === 'step') step();
    else if (action === 'randomise') randomise();
    else if (action === 'clear') clearGrid();
    else if (action === 'invert') invertGrid();
  });

  resizeBuffers(size);
  resizeCanvasToWindow();
  seedVisiblePattern();
  requestAnimationFrame(loop);
})();
