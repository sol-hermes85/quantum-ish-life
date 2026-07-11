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
  highlife: { under: 0.10, survive: 0.92, over: 0.70, birth: 0.88, noise: 0.01 },
  spark: { under: 0.20, survive: 0.80, over: 0.35, birth: 0.90, noise: 0.05 },
  chaotic: { under: 0.35, survive: 0.70, over: 0.50, birth: 0.95, noise: 0.08 }
};

function rulePresetValues(name) {
  return RULE_PRESETS[name] || null;
}

function shouldBirthForRule(ruleName, neighbourCount) {
  return neighbourCount === 3 || (ruleName === 'highlife' && neighbourCount === 6);
}

function displayRulePresetName(value) {
  const names = {
    '': 'custom',
    classic: 'Classic-ish',
    calm: 'Calm',
    highlife: 'HighLife-ish',
    spark: 'Spark',
    chaotic: 'Chaotic'
  };

  return names[value] || value;
}

function clampZoomLevel(value) {
  return Math.max(0.25, Math.min(4, Math.round(value * 100) / 100));
}

function effectiveDevicePixelRatio(value) {
  return Math.max(1, Math.min(2, value || 1));
}

function nextZoomLevel(current, wheelDelta) {
  const direction = wheelDelta < 0 ? 1 : -1;
  const next = current + direction * 0.1;
  return clampZoomLevel(next);
}

function nextPinchZoomLevel(current, startDistance, currentDistance) {
  if (startDistance <= 0) return current;
  const next = current * (currentDistance / startDistance);
  return clampZoomLevel(next);
}

function baseGridRect(canvasWidth, canvasHeight) {
  const size = Math.min(canvasWidth, canvasHeight);
  return {
    x: (canvasWidth - size) / 2,
    y: (canvasHeight - size) / 2,
    size
  };
}

function clampView(zoom, panX, panY, canvasWidth, canvasHeight) {
  const base = baseGridRect(canvasWidth, canvasHeight);
  const scaledWidth = base.size * zoom;
  const scaledHeight = base.size * zoom;
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
  const side = baseGridRect(canvasWidth, canvasHeight).size;
  const relativeX = (anchorX - panX) / (side * currentZoom);
  const relativeY = (anchorY - panY) / (side * currentZoom);
  const nextPanX = anchorX - relativeX * side * nextZoom;
  const nextPanY = anchorY - relativeY * side * nextZoom;
  return clampView(nextZoom, nextPanX, nextPanY, canvasWidth, canvasHeight);
}

function dragView(zoom, panX, panY, deltaX, deltaY, canvasWidth, canvasHeight) {
  return clampView(zoom, panX + deltaX, panY + deltaY, canvasWidth, canvasHeight);
}

function probabilityBounds(values, size, threshold = 0.05) {
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < values.length; i++) {
    if (values[i] < threshold) continue;
    const x = i % size;
    const y = Math.floor(i / size);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return maxX >= 0 ? { minX, minY, maxX, maxY } : null;
}

function cameraForGridBounds(bounds, size, canvasWidth, canvasHeight) {
  if (!bounds) return clampView(1, 0, 0, canvasWidth, canvasHeight);

  const base = baseGridRect(canvasWidth, canvasHeight);
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);
  const zoomForWidth = (canvasWidth * 0.74) / (base.size * (width / size));
  const zoomForHeight = (canvasHeight * 0.74) / (base.size * (height / size));
  const nextZoom = clampZoomLevel(Math.min(zoomForWidth, zoomForHeight));
  const centreX = (bounds.minX + bounds.maxX + 1) / 2;
  const centreY = (bounds.minY + bounds.maxY + 1) / 2;
  const nextPanX = canvasWidth / 2 - (centreX / size) * base.size * nextZoom;
  const nextPanY = canvasHeight / 2 - (centreY / size) * base.size * nextZoom;

  return clampView(nextZoom, nextPanX, nextPanY, canvasWidth, canvasHeight);
}

function gridBoundaryOpacity(zoom) {
  return Math.min(0.32, Math.max(0.14, Math.round((0.1 + zoom * 0.05) * 100) / 100));
}

function shouldApplyZoom(currentZoom, nextZoom) {
  return currentZoom !== nextZoom;
}

function shouldDisableZoomControl(zoom, direction) {
  return direction < 0 ? zoom <= 0.25 : zoom >= 4;
}

function setDisabledIfChanged(element, disabled) {
  if (element.disabled === disabled) return false;
  element.disabled = disabled;
  return true;
}

function shouldChangeTool(currentTool, nextTool) {
  return currentTool !== nextTool;
}

function screenToGridPoint(screenX, screenY, size, canvasWidth, canvasHeight, zoom, panX, panY) {
  const side = baseGridRect(canvasWidth, canvasHeight).size;
  return {
    x: Math.floor(((screenX - panX) / (side * zoom)) * size),
    y: Math.floor(((screenY - panY) / (side * zoom)) * size)
  };
}

function isGridPointInside(point, size) {
  return point.x >= 0 && point.x < size && point.y >= 0 && point.y < size;
}

function sameGridPoint(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function brushFootprint(point, mode, size) {
  if (mode !== 'bloom') return [{ x: point.x, y: point.y, strength: 1 }];

  const cells = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = point.x + dx;
      const y = point.y + dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const strength = dx === 0 && dy === 0 ? 1 : (dx === 0 || dy === 0 ? 0.6 : 0.35);
      cells.push({ x, y, strength });
    }
  }
  return cells;
}

function applyBrushProbability(currentProbability, tool, strength) {
  const current = Math.max(0, Math.min(1, currentProbability));
  const amount = Math.max(0, Math.min(1, strength));
  const next = tool === 'erase'
    ? current * (1 - amount)
    : current + (1 - current) * amount;
  return Math.round(next * 1000) / 1000;
}

function applyStrongestBrushProbability(originalProbability, currentProbability, tool, previousStrength, nextStrength) {
  if (nextStrength <= previousStrength) return currentProbability;
  return applyBrushProbability(originalProbability, tool, nextStrength);
}

function effectivePaintTool(selectedTool, altKey) {
  if (!altKey) return selectedTool;
  return selectedTool === 'erase' ? 'paint' : 'erase';
}

function brushModeLabel(value) {
  return value === 'bloom' ? 'Bloom' : 'Dot';
}

function nextBrushMode(value) {
  return value === 'bloom' ? 'dot' : 'bloom';
}

function toolStatusLabel(selectedTool, brushMode) {
  return `${selectedTool === 'paint' ? 'Paint' : 'Erase'} · ${brushModeLabel(brushMode)}`;
}

function shouldResetStrokeStrengths(previousTool, nextTool) {
  return previousTool !== nextTool;
}

function interpolatedGridPoints(from, to) {
  if (!from || sameGridPoint(from, to)) return [to];

  const points = [];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let error = dx - dy;
  let x = from.x;
  let y = from.y;

  while (true) {
    points.push({ x, y });
    if (x === to.x && y === to.y) break;

    const doubledError = error * 2;
    if (doubledError > -dy) {
      error -= dy;
      x += sx;
    }
    if (doubledError < dx) {
      error += dx;
      y += sy;
    }
  }

  return points;
}

function shouldPanPointer(event) {
  return event.button === 1 || event.button === 2 || event.shiftKey;
}

function shouldClearHoverCell(hoverCell) {
  return hoverCell !== null;
}

function shouldRedrawBrushModeChange(hoverCell) {
  return hoverCell !== null;
}

function cameraChanged(previous, next) {
  return previous.zoom !== next.zoom || previous.panX !== next.panX || previous.panY !== next.panY;
}

function shouldDrawGuideGrid(cellWidth, cellHeight) {
  return Math.min(cellWidth, cellHeight) >= 6;
}

function guideGridOpacity(cellWidth, cellHeight) {
  const cellSize = Math.min(cellWidth, cellHeight);
  if (!shouldDrawGuideGrid(cellWidth, cellHeight)) return 0;
  return Math.min(0.22, Math.max(0.10, Math.round((0.08 + cellSize / 120) * 100) / 100));
}

function isRectVisible(x, y, width, height, viewportWidth, viewportHeight) {
  return x < viewportWidth && y < viewportHeight && x + width > 0 && y + height > 0;
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
    escape: 'pause',
    backspace: 'clear',
    delete: 'clear',
    ' ': 'play',
    1: 'paint-tool',
    2: 'erase-tool',
    p: 'play',
    '+': 'zoom-in',
    '=': 'zoom-in',
    '-': 'zoom-out',
    _: 'zoom-out',
    c: 'clear',
    b: 'toggle-brush',
    e: 'toggle-tool',
    f: 'frame-cells',
    h: 'toggle-controls',
    i: 'invert',
    d: 'toggle-disco',
    t: 'toggle-time-echo',
    r: 'randomise',
    s: 'step',
    home: 'reset-view',
    z: 'reset-view',
    0: 'reset-view'
  };

  return shortcuts[String(key).toLowerCase()] || null;
}

function shouldIgnoreShortcutTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

function zoomPercentLabel(value) {
  return `${Math.round(value * 100)}%`;
}

function pageTitleForState(running, generation) {
  const status = running ? 'Running' : 'Paused';
  return `${status} · Gen ${generation} · Quantum-ish Life`;
}

function populationTrendLabel(previousLiveCount, liveCount) {
  if (previousLiveCount === null) return 'steady';
  if (liveCount > previousLiveCount) return 'rising';
  if (liveCount < previousLiveCount) return 'falling';
  return 'steady';
}

function setPopulationTrendClass(element, trend) {
  element.classList.toggle('trendRising', trend === 'rising');
  element.classList.toggle('trendFalling', trend === 'falling');
  element.classList.toggle('trendSteady', trend === 'steady');
}

function setDocumentTitleIfChanged(documentRef, title) {
  if (documentRef.title === title) return false;
  documentRef.title = title;
  return true;
}

function pauseFeedbackLabel(generation) {
  return `Paused · Gen ${generation}`;
}

function nextTickTimestampOnResume(previousRunning, nextRunning, now, previousTick) {
  return !previousRunning && nextRunning ? now : previousTick;
}

function shouldAutoCollapseControlsOnPlay(running, viewportWidth, controlsCollapsed) {
  return running && viewportWidth <= 640 && !controlsCollapsed;
}

function shouldPauseWhenHidden(running, visibilityState) {
  return running && visibilityState === 'hidden';
}

function shouldRedrawForControlInput(key, discoMode) {
  if (!['hue', 'saturation', 'discoMode', 'timeEcho'].includes(key)) return false;
  return !(discoMode && (key === 'hue' || key === 'saturation'));
}

function shouldResetViewTap(previousTime, previousPoint, currentTime, currentPoint) {
  if (!previousTime || !previousPoint) return false;
  if (currentTime - previousTime > 320) return false;

  return distanceSquared(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y) <= 24 ** 2;
}

function displayPresetName(value) {
  const names = {
    '': 'none',
    glider: 'Glider',
    blinker: 'Blinker',
    trafficLight: 'Traffic light',
    lwss: 'Lightweight spaceship',
    rPentomino: 'R-pentomino',
    smallExploder: 'Small exploder',
    acorn: 'Acorn',
    diehard: 'Diehard',
    loaf: 'Loaf',
    block: 'Block',
    toad: 'Toad',
    cross: 'Cross',
    diamond: 'Diamond',
    boat: 'Boat',
    tub: 'Tub',
    pulsar: 'Pulsar',
    beacon: 'Beacon',
    clock: 'Clock',
    pentadecathlon: 'Pentadecathlon',
    gosperGun: 'Gosper glider gun',
    'random-soup': 'Random soup'
  };

  return names[value] || value;
}

function patternPresetLabel(value, size) {
  if (!value || value === 'random-soup') return displayPresetName(value);

  const count = patternCells(value, size).length;
  return count > 0 ? `${displayPresetName(value)} (${count} cells)` : displayPresetName(value);
}

function invertProbabilityGrid(values, ageValues) {
  for (let i = 0; i < values.length; i++) {
    values[i] = 1 - values[i];
    ageValues[i] = values[i] > 0 ? Math.max(1, ageValues[i]) : 0;
  }
}

function countCollapsedNeighbours(collapsedValues, size, x, y) {
  const yAbove = ((y - 1 + size) % size) * size;
  const yCurrent = y * size;
  const yBelow = ((y + 1) % size) * size;
  const xLeft = (x - 1 + size) % size;
  const xRight = (x + 1) % size;

  return collapsedValues[yAbove + xLeft]
    + collapsedValues[yAbove + x]
    + collapsedValues[yAbove + xRight]
    + collapsedValues[yCurrent + xLeft]
    + collapsedValues[yCurrent + xRight]
    + collapsedValues[yBelow + xLeft]
    + collapsedValues[yBelow + x]
    + collapsedValues[yBelow + xRight];
}

function distanceSquared(dx, dy) {
  return dx * dx + dy * dy;
}

function firstTwoPointerValues(pointerMap) {
  const iterator = pointerMap.values();
  return {
    first: iterator.next().value,
    second: iterator.next().value
  };
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
    trafficLight: [[-1, -2], [0, -2], [1, -2], [-1, 0], [0, 0], [1, 0], [-1, 2], [0, 2], [1, 2]],
    lwss: [[0, -2], [3, -2], [-1, -1], [-1, 0], [3, 0], [-1, 1], [0, 1], [1, 1], [2, 1]],
    rPentomino: [[0, -1], [1, -1], [-1, 0], [0, 0], [0, 1]],
    smallExploder: [[0, -2], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
    acorn: [[-3, 0], [-2, 0], [-2, -2], [1, -1], [2, 0], [3, 0], [4, 0]],
    diehard: [[-3, 0], [-2, 0], [-2, 1], [2, 1], [3, -1], [3, 1], [4, 1]],
    loaf: [[0, -2], [1, -2], [-1, -1], [2, -1], [0, 0], [2, 0], [1, 1]],
    block: [[0, 0], [1, 0], [0, 1], [1, 1]],
    toad: [[0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0]],
    cross: [[0, -2], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [0, 2]],
    diamond: [[0, -3], [-1, -2], [1, -2], [-2, -1], [2, -1], [-3, 0], [3, 0], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, 3]],
    boat: [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
    tub: [[0, -2], [-1, -1], [1, -1], [0, 0]],
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
    beacon: [[-2, -2], [-1, -2], [-2, -1], [1, 1], [2, 1], [1, 2], [2, 2]],
    clock: [[-1, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [0, 1], [1, 1], [0, 2]],
    pentadecathlon: [[0, -4], [0, -3], [-1, -2], [1, -2], [0, -1], [0, 0], [0, 1], [-1, 2], [1, 2], [0, 3], [0, 4], [0, 5]],
    gosperGun: [
      [-18, -4], [-17, -4], [-18, -3], [-17, -3],
      [-8, -4], [-8, -3], [-8, -2], [-7, -5], [-7, -1], [-6, -6], [-6, 0], [-5, -6], [-5, 0], [-4, -3], [-3, -5], [-3, -1], [-2, -4], [-2, -3], [-2, -2], [-1, -3],
      [2, -6], [2, -5], [2, -4], [3, -6], [3, -5], [3, -4], [4, -7], [4, -3], [6, -8], [6, -7], [6, -3], [6, -2],
      [16, -6], [17, -6], [16, -5], [17, -5]
    ]
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

function gridPixelColour(probability, cellIndex, generation, discoMode, selectedLiveColour) {
  if (probability <= 0) return { r: 255, g: 255, b: 255 };

  const liveColour = discoMode ? rainbowCellColour(cellIndex, generation) : selectedLiveColour;
  if (probability >= 1) return liveColour;
  return blendLiveCellColour(probability, liveColour, discoMode);
}

function updateEchoTrail(echoValues, sourceValues, decay = 0.72) {
  for (let i = 0; i < echoValues.length; i++) {
    echoValues[i] = Math.max(sourceValues[i], echoValues[i] * decay);
  }
}

function echoDisplayProbability(currentProbability, echoProbability) {
  return Math.max(currentProbability, Math.round(echoProbability * 0.32 * 1000) / 1000);
}

function populationPercent(liveCount, totalCells) {
  if (totalCells <= 0) return '0.0%';
  return `${((liveCount / totalCells) * 100).toFixed(1)}%`;
}

function paintStrokeFeedback(tool, changedCount) {
  if (changedCount <= 0) return '';
  const verb = tool === 'mixed' ? 'Changed' : (tool === 'erase' ? 'Erased' : 'Painted');
  const noun = changedCount === 1 ? 'cell' : 'cells';
  return `${verb} ${changedCount} ${noun}`;
}

function feedbackDuration(message) {
  return message.length > 18 ? 1300 : 900;
}

function clearButtonLabel(pending) {
  return pending ? 'Sure?' : 'Clear';
}

function clearConfirmationActive(now, pendingUntil) {
  return pendingUntil > 0 && now <= pendingUntil;
}

function resetStrokeCollections(strokeStates, changedIndices) {
  strokeStates.clear();
  changedIndices.clear();
}

function tapMemoryFromPointerUp(tapCandidate, timeStamp, point) {
  return {
    time: timeStamp || tapCandidate.time,
    point
  };
}

function setTextIfChanged(element, value) {
  if (element.textContent === value) return false;
  element.textContent = value;
  return true;
}

function collapseProbability(probability) {
  if (probability <= 0) return 0;
  if (probability >= 1) return 1;
  return Math.random() < probability ? 1 : 0;
}

function shouldRebuildPixelBuffer(pixelBufferDirty) {
  return pixelBufferDirty === true;
}

function simulationStepBudget(elapsedMs, intervalMs, maxSteps = 4) {
  if (intervalMs <= 0 || elapsedMs < intervalMs) return 0;
  return Math.min(maxSteps, Math.floor(elapsedMs / intervalMs));
}

function nextTickAfterSimulationSteps(previousTick, intervalMs, steps, timestampMs, maxSteps = 4) {
  if (steps <= 0) return previousTick;
  const nextTick = previousTick + intervalMs * steps;
  return steps >= maxSteps && timestampMs - nextTick >= intervalMs ? timestampMs : nextTick;
}

function primeImageAlpha(imageData) {
  for (let i = 3; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255;
  }
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
    frameView: $('frameView'),
    feedback: $('feedback'),
    shell: $('shell'),
    panel: $('controlsPanel'),
    controlsToggle: $('controlsToggle'),
    gridSize: $('gridSize'),
    ageLimit: $('ageLimit'),
    density: $('density'),
    brushMode: $('brushMode'),
    patternPreset: $('patternPreset'),
    rulePreset: $('rulePreset'),
    hue: $('hue'),
    saturation: $('saturation'),
    discoMode: $('discoMode'),
    timeEcho: $('timeEcho'),
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
    populationTrend: $('populationTrend'),
    toolStatus: $('toolStatus'),
    zoomLevel: $('zoomLevel'),
    runStatus: $('runStatus'),
    gridSize: $('gridSizeValue'),
    ageLimit: $('ageLimitValue'),
    density: $('densityValue'),
    brushMode: $('brushModeValue'),
    patternPreset: $('patternPresetValue'),
    rulePreset: $('rulePresetValue'),
    hue: $('hueValue'),
    saturation: $('saturationValue'),
    discoMode: $('discoModeValue'),
    timeEcho: $('timeEchoValue'),
    speed: $('speedValue'),
    under: $('underValue'),
    survive: $('surviveValue'),
    over: $('overValue'),
    birth: $('birthValue'),
    noise: $('noiseValue')
  };

  let size = Number(controls.gridSize.value);
  let grid = new Float32Array(size * size);
  let echo = new Float32Array(size * size);
  let next = new Float32Array(size * size);
  let collapsed = new Uint8Array(size * size);
  let ages = new Uint16Array(size * size);
  let nextAges = new Uint16Array(size * size);
  let generation = 0;
  let lastLiveCount = null;
  let running = false;
  let lastTick = 0;
  let isDrawing = false;
  let isPanning = false;
  let strokePaintStates = new Map();
  let strokeChangedIndices = new Set();
  let strokeStrengthTool = 'paint';
  let lastPaintPoint = null;
  let strokeFeedbackTool = 'paint';
  let lastPanPoint = { x: 0, y: 0 };
  let tool = 'paint';
  let drawQueued = false;
  let pixelBufferDirty = true;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let controlsCollapsed = false;
  let labelsDirty = true;
  let selectedLiveColour = hslToRgb(200, 0.85, 0.45);
  let colourDirty = false;
  let hoverCell = null;
  let hoverPreviewTool = 'paint';
  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let pinchStartPanX = 0;
  let pinchStartPanY = 0;
  let pinchStartMidpoint = { x: 0, y: 0 };
  let pinchGestureActive = false;
  let feedbackTimer = 0;
  let clearConfirmTimer = 0;
  let clearPendingUntil = 0;
  let lastTapTime = 0;
  let lastTapPoint = null;
  let tapCandidate = null;

  const bufferCanvas = document.createElement('canvas');
  const bufferCtx = bufferCanvas.getContext('2d', { alpha: false });
  let image = null;

  function resizeBuffers(newSize) {
    size = newSize;
    grid = new Float32Array(size * size);
    echo = new Float32Array(size * size);
    next = new Float32Array(size * size);
    collapsed = new Uint8Array(size * size);
    ages = new Uint16Array(size * size);
    nextAges = new Uint16Array(size * size);
    bufferCanvas.width = size;
    bufferCanvas.height = size;
    image = bufferCtx.createImageData(size, size);
    primeImageAlpha(image);
  }

  function resizeCanvasToWindow() {
    const dpr = effectiveDevicePixelRatio(window.devicePixelRatio);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    const camera = clampView(zoom, panX, panY, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
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
    echo.fill(0);
    ages.fill(0);
    const mid = Math.floor(size / 2);
    const innerRadiusSquared = (size * 0.18) ** 2;
    const outerRadiusSquared = (size * 0.28) ** 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - mid;
        const dy = y - mid;
        const d2 = distanceSquared(dx, dy);
        const i = idx(x, y);

        if (d2 < innerRadiusSquared) {
          grid[i] = 0.85;
          ages[i] = 1;
        } else if (d2 < outerRadiusSquared) {
          grid[i] = 0.45;
          ages[i] = 1;
        } else if (Math.random() < 0.04) {
          grid[i] = Math.random() * 0.8;
          ages[i] = 1;
        }
      }
    }

    generation = 0;
    lastLiveCount = null;
    requestGridDraw();
  }

  function resetPatternSelection() {
    if (!controls.patternPreset.value) return;
    controls.patternPreset.value = '';
    updateLabels();
  }

  function randomise({ keepPreset = false } = {}) {
    cancelClearConfirmation();
    if (!keepPreset) resetPatternSelection();
    grid.fill(0);
    echo.fill(0);
    ages.fill(0);

    const density = Number(controls.density.value);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < density ? Math.random() : 0;
      ages[i] = grid[i] > 0 ? 1 : 0;
    }

    generation = 0;
    lastLiveCount = null;
    if (!keepPreset) showFeedback('Randomised');
    requestGridDraw();
  }

  function collapse() {
    for (let i = 0; i < grid.length; i++) {
      collapsed[i] = collapseProbability(grid[i]);
    }
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
      const rowOffset = y * size;
      for (let x = 0; x < size; x++) {
        const i = rowOffset + x;
        const alive = collapsed[i] === 1;
        const age = alive ? ages[i] + 1 : 0;
        const n = countCollapsedNeighbours(collapsed, size, x, y);
        let p = noise > 0 ? noise * Math.random() : 0;

        if (shouldCellAgeOut(age, ageLimit)) {
          p = 0;
        } else if (alive && n < 2) p = under;
        else if (alive && (n === 2 || n === 3)) p = survive;
        else if (alive && n > 3) p = over;
        else if (!alive && shouldBirthForRule(controls.rulePreset.value, n)) p = birth;

        next[i] = clamp(p);
        nextAges[i] = nextCellAge(alive, ages[i], p);
      }
    }

    if (controls.timeEcho.checked) updateEchoTrail(echo, grid);
    [grid, next] = [next, grid];
    [ages, nextAges] = [nextAges, ages];
    generation++;
    requestGridDraw();
  }

  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(draw);
  }

  function requestGridDraw() {
    pixelBufferDirty = true;
    requestDraw();
  }

  function rebuildPixelBuffer() {
    const pixels = image.data;
    let total = 0;
    let liveCount = 0;

    const discoMode = controls.discoMode.checked;
    if (!discoMode && colourDirty) {
      selectedLiveColour = hslToRgb(Number(controls.hue.value), Number(controls.saturation.value) / 100, 0.45);
      colourDirty = false;
    }
    const liveColour = discoMode ? null : selectedLiveColour;

    for (let i = 0; i < grid.length; i++) {
      const p = grid[i];
      const displayProbability = controls.timeEcho.checked ? echoDisplayProbability(p, echo[i]) : p;
      const colour = gridPixelColour(displayProbability, i, generation, discoMode, liveColour);
      const o = i * 4;

      total += p;
      if (p >= 0.5) liveCount++;
      pixels[o] = colour.r;
      pixels[o + 1] = colour.g;
      pixels[o + 2] = colour.b;
    }

    bufferCtx.putImageData(image, 0, 0);
    setTextIfChanged(labels.generation, String(generation));
    setTextIfChanged(labels.average, (total / grid.length).toFixed(3));
    setTextIfChanged(labels.liveCount, String(liveCount));
    setTextIfChanged(labels.livePercent, populationPercent(liveCount, grid.length));
    const trend = populationTrendLabel(lastLiveCount, liveCount);
    setTextIfChanged(labels.populationTrend, trend);
    setPopulationTrendClass(labels.populationTrend, trend);
    lastLiveCount = liveCount;
    pixelBufferDirty = false;
  }

  function draw() {
    drawQueued = false;
    if (shouldRebuildPixelBuffer(pixelBufferDirty)) rebuildPixelBuffer();

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawSize = baseGridRect(canvas.width, canvas.height).size * zoom;
    ctx.drawImage(bufferCanvas, panX, panY, drawSize, drawSize);
    drawGridBoundary(drawSize);
    drawGuideGrid(drawSize);
    drawHoverPreview(drawSize);

    setTextIfChanged(labels.zoomLevel, zoomPercentLabel(zoom));
    setTextIfChanged(labels.runStatus, running ? 'Running' : 'Paused');
    updateZoomControlState();
    setDocumentTitleIfChanged(document, pageTitleForState(running, generation));
    if (labelsDirty) updateLabels();
  }

  function updateZoomControlState() {
    setDisabledIfChanged(controls.zoomOut, shouldDisableZoomControl(zoom, -1));
    setDisabledIfChanged(controls.zoomIn, shouldDisableZoomControl(zoom, 1));
  }

  function drawGridBoundary(drawSize) {
    ctx.strokeStyle = `rgba(16,16,16,${gridBoundaryOpacity(zoom)})`;
    ctx.lineWidth = Math.max(1, Math.min(3, Math.round(zoom)));
    ctx.strokeRect(Math.round(panX) + 0.5, Math.round(panY) + 0.5, Math.round(drawSize), Math.round(drawSize));
  }

  function drawGuideGrid(drawSize) {
    const cellX = drawSize / size;
    const cellY = drawSize / size;
    if (!shouldDrawGuideGrid(cellX, cellY)) return;

    const startX = panX;
    const startY = panY;

    ctx.strokeStyle = `rgba(0,0,0,${guideGridOpacity(cellX, cellY)})`;
    ctx.lineWidth = 1;

    const visibleX = visibleGridLineRange(startX, cellX, size, canvas.width);
    const visibleY = visibleGridLineRange(startY, cellY, size, canvas.height);

    ctx.beginPath();
    for (let i = visibleX.first; i <= visibleX.last; i++) {
      const x = Math.round(startX + i * cellX) + 0.5;
      ctx.moveTo(x, Math.max(0, startY));
      ctx.lineTo(x, Math.min(canvas.height, startY + drawSize));
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = visibleY.first; i <= visibleY.last; i++) {
      const y = Math.round(startY + i * cellY) + 0.5;
      ctx.moveTo(Math.max(0, startX), y);
      ctx.lineTo(Math.min(canvas.width, startX + drawSize), y);
    }
    ctx.stroke();
  }

  function drawHoverPreview(drawSize) {
    if (!hoverCell) return;

    const cellX = drawSize / size;
    const cellY = drawSize / size;
    if (Math.min(cellX, cellY) < 4) return;

    ctx.fillStyle = hoverPreviewTool === 'erase' ? 'rgba(20,20,20,0.10)' : 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = hoverPreviewTool === 'erase' ? 'rgba(20,20,20,0.72)' : 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(1, Math.min(3, Math.round(Math.min(cellX, cellY) * 0.12)));

    for (const preview of brushFootprint(hoverCell, controls.brushMode.value, size)) {
      const x = panX + preview.x * cellX;
      const y = panY + preview.y * cellY;
      if (!isRectVisible(x, y, cellX, cellY, canvas.width, canvas.height)) continue;
      ctx.globalAlpha = Math.max(0.3, preview.strength);
      ctx.fillRect(x + 1, y + 1, Math.max(1, cellX - 2), Math.max(1, cellY - 2));
      ctx.strokeRect(x + 1, y + 1, Math.max(1, cellX - 2), Math.max(1, cellY - 2));
    }
    ctx.globalAlpha = 1;
  }

  function updateLabels() {
    setTextIfChanged(labels.gridSize, `${size} × ${size}`);
    setTextIfChanged(labels.ageLimit, controls.ageLimit.value === '0' ? 'never' : `${controls.ageLimit.value} gen`);
    setTextIfChanged(labels.density, `${Math.round(Number(controls.density.value) * 100)}%`);
    setTextIfChanged(labels.brushMode, brushModeLabel(controls.brushMode.value));
    setTextIfChanged(labels.patternPreset, patternPresetLabel(controls.patternPreset.value, size));
    setTextIfChanged(labels.rulePreset, displayRulePresetName(controls.rulePreset.value));
    setTextIfChanged(labels.toolStatus, toolStatusLabel(tool, controls.brushMode.value));
    setTextIfChanged(labels.hue, `${controls.hue.value}°`);
    setTextIfChanged(labels.saturation, `${controls.saturation.value}%`);
    setTextIfChanged(labels.discoMode, controls.discoMode.checked ? 'on' : 'off');
    setTextIfChanged(labels.timeEcho, controls.timeEcho.checked ? 'on' : 'off');
    setTextIfChanged(labels.speed, `${controls.speed.value} gen/s`);

    for (const key of ['under', 'survive', 'over', 'birth', 'noise']) {
      setTextIfChanged(labels[key], Number(controls[key].value).toFixed(2));
    }

    labelsDirty = false;
  }

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const screenX = ((e.clientX - r.left) / r.width) * canvas.width;
    const screenY = ((e.clientY - r.top) / r.height) * canvas.height;
    return screenToGridPoint(screenX, screenY, size, canvas.width, canvas.height, zoom, panX, panY);
  }

  function updateHoverCell(e) {
    const point = canvasPoint(e);
    const nextHoverCell = isGridPointInside(point, size) ? point : null;
    const nextHoverPreviewTool = effectivePaintTool(tool, e.altKey);
    if (sameGridPoint(hoverCell, nextHoverCell) && hoverPreviewTool === nextHoverPreviewTool) return;

    hoverCell = nextHoverCell;
    hoverPreviewTool = nextHoverPreviewTool;
    requestDraw();
  }

  function paintPoint(point, paintTool, strength = 1) {
    if (!isGridPointInside(point, size)) return false;

    const i = idx(point.x, point.y);
    const state = strokePaintStates.get(i) || { originalProbability: grid[i], strength: 0 };
    if (strength <= state.strength) return false;
    const nextProbability = applyStrongestBrushProbability(
      state.originalProbability,
      grid[i],
      paintTool,
      state.strength,
      strength
    );
    strokePaintStates.set(i, { originalProbability: state.originalProbability, strength });
    if (nextProbability === grid[i]) return false;

    grid[i] = nextProbability;
    ages[i] = nextProbability > 0 ? Math.max(1, ages[i]) : 0;
    strokeChangedIndices.add(i);
    return true;
  }

  function paint(e) {
    const p = canvasPoint(e);
    if (!isGridPointInside(p, size)) return;

    const paintTool = effectivePaintTool(tool, e.altKey);
    if (shouldResetStrokeStrengths(strokeStrengthTool, paintTool)) {
      strokePaintStates.clear();
      strokeStrengthTool = paintTool;
      strokeFeedbackTool = 'mixed';
    }
    let changed = false;
    for (const centre of interpolatedGridPoints(lastPaintPoint, p)) {
      for (const point of brushFootprint(centre, controls.brushMode.value, size)) {
        changed = paintPoint(point, paintTool, point.strength) || changed;
      }
    }

    lastPaintPoint = p;
    if (changed) requestGridDraw();
  }

  function panFromPointer(e) {
    const current = toCanvasPoint(e);
    const camera = dragView(zoom, panX, panY, current.x - lastPanPoint.x, current.y - lastPanPoint.y, canvas.width, canvas.height);
    const previous = { zoom, panX, panY };
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    lastPanPoint = current;
    if (!cameraChanged(previous, camera)) return;
    requestDraw();
  }

  function updateShellMode() {
    controls.shell.classList.toggle('eraseModeActive', tool === 'erase');
    controls.shell.classList.toggle('panningActive', isPanning || activePointers.size >= 2);
    controls.shell.classList.toggle('running', running);
  }

  function setTool(t) {
    if (!shouldChangeTool(tool, t)) return;

    tool = t;
    controls.paintMode.classList.toggle('primary', t === 'paint');
    controls.eraseMode.classList.toggle('primary', t === 'erase');
    controls.paintMode.setAttribute('aria-pressed', String(t === 'paint'));
    controls.eraseMode.setAttribute('aria-pressed', String(t === 'erase'));
    setTextIfChanged(labels.toolStatus, toolStatusLabel(t, controls.brushMode.value));
    updateShellMode();
    showFeedback(t === 'paint' ? 'Paint mode' : 'Erase mode');
  }

  function toggleBrushMode() {
    controls.brushMode.value = nextBrushMode(controls.brushMode.value);
    updateLabels();
    showFeedback(`${brushModeLabel(controls.brushMode.value)} brush`);
    if (shouldRedrawBrushModeChange(hoverCell)) requestDraw();
  }

  function showFeedback(message) {
    controls.feedback.textContent = message;
    controls.feedback.classList.add('visible');
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      controls.feedback.classList.remove('visible');
    }, feedbackDuration(message));
  }

  function setControlsCollapsed(collapsed) {
    controlsCollapsed = collapsed;
    controls.panel.classList.toggle('collapsed', controlsCollapsed);
    controls.controlsToggle.textContent = controlsCollapsed ? 'Show controls' : 'Hide controls';
    controls.controlsToggle.setAttribute('aria-expanded', String(!controlsCollapsed));
  }

  function setClearConfirmation(pending) {
    clearPendingUntil = pending ? performance.now() + 1800 : 0;
    controls.clear.classList.toggle('dangerPending', pending);
    controls.clear.textContent = clearButtonLabel(pending);
    controls.clear.setAttribute('aria-label', pending ? 'Confirm clear grid' : 'Clear grid');
  }

  function cancelClearConfirmation() {
    clearTimeout(clearConfirmTimer);
    setClearConfirmation(false);
  }

  function resetView() {
    const camera = clampView(1, 0, 0, canvas.width, canvas.height);
    const previous = { zoom, panX, panY };
    if (!cameraChanged(previous, camera)) return;

    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    showFeedback('View reset');
    requestDraw();
  }

  function frameLiveCells() {
    const bounds = probabilityBounds(grid, size);
    const camera = cameraForGridBounds(bounds, size, canvas.width, canvas.height);
    const previous = { zoom, panX, panY };
    if (!cameraChanged(previous, camera)) {
      showFeedback(bounds ? 'Cells framed' : 'View reset');
      return;
    }

    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    showFeedback(bounds ? 'Cells framed' : 'View reset');
    requestDraw();
  }

  function framePresetCells() {
    const camera = cameraForGridBounds(probabilityBounds(grid, size), size, canvas.width, canvas.height);
    const previous = { zoom, panX, panY };
    if (!cameraChanged(previous, camera)) return;

    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
  }

  function togglePlay() {
    const previousRunning = running;
    running = !running;
    lastTick = nextTickTimestampOnResume(previousRunning, running, performance.now(), lastTick);
    controls.play.textContent = running ? 'Pause' : 'Play';
    controls.play.classList.toggle('primary', !running);
    controls.play.setAttribute('aria-pressed', String(running));
    labels.runStatus.textContent = running ? 'Running' : 'Paused';
    setDocumentTitleIfChanged(document, pageTitleForState(running, generation));
    updateShellMode();
    if (shouldAutoCollapseControlsOnPlay(running, window.innerWidth, controlsCollapsed)) setControlsCollapsed(true);
    showFeedback(running ? 'Running' : pauseFeedbackLabel(generation));
  }

  function pauseSimulation() {
    if (!running) return;
    togglePlay();
  }

  function manualStep() {
    step();
    showFeedback(`Gen ${generation}`);
  }

  function pauseForHiddenTab() {
    if (!shouldPauseWhenHidden(running, document.visibilityState)) return;

    running = false;
    controls.play.textContent = 'Play';
    controls.play.classList.add('primary');
    controls.play.setAttribute('aria-pressed', 'false');
    labels.runStatus.textContent = 'Paused';
    setDocumentTitleIfChanged(document, pageTitleForState(running, generation));
    updateShellMode();
  }

  function clearGrid() {
    cancelClearConfirmation();
    resetPatternSelection();
    grid.fill(0);
    echo.fill(0);
    ages.fill(0);
    generation = 0;
    lastLiveCount = null;
    showFeedback('Grid cleared');
    requestGridDraw();
  }

  function confirmOrClearGrid() {
    if (!clearConfirmationActive(performance.now(), clearPendingUntil)) {
      setClearConfirmation(true);
      showFeedback('Tap Clear again');
      clearTimeout(clearConfirmTimer);
      clearConfirmTimer = setTimeout(() => setClearConfirmation(false), 1800);
      return;
    }

    clearGrid();
  }

  function invertGrid() {
    cancelClearConfirmation();
    resetPatternSelection();
    invertProbabilityGrid(grid, ages);
    echo.fill(0);
    generation = 0;
    lastLiveCount = null;
    showFeedback('Grid inverted');
    requestGridDraw();
  }

  function toggleDiscoMode() {
    controls.discoMode.checked = !controls.discoMode.checked;
    updateLabels();
    showFeedback(controls.discoMode.checked ? 'Disco on' : 'Disco off');
    requestGridDraw();
  }

  function toggleTimeEcho() {
    controls.timeEcho.checked = !controls.timeEcho.checked;
    if (!controls.timeEcho.checked) echo.fill(0);
    updateLabels();
    showFeedback(controls.timeEcho.checked ? 'Time Echo on' : 'Time Echo off');
    requestGridDraw();
  }

  function applyPattern(pattern) {
    cancelClearConfirmation();
    if (pattern === 'random-soup') {
      randomise({ keepPreset: true });
      showFeedback('Random soup');
      return;
    }

    const cells = patternCells(pattern, size);
    if (!cells.length) return;

    grid.fill(0);
    echo.fill(0);
    ages.fill(0);
    for (const { x, y } of cells) {
      const i = idx(x, y);
      grid[i] = 1;
      ages[i] = 1;
    }

    generation = 0;
    lastLiveCount = null;
    framePresetCells();
    showFeedback(`${displayPresetName(pattern)} loaded`);
    requestGridDraw();
  }

  function applyRulePreset(name) {
    const preset = rulePresetValues(name);
    if (!preset) {
      updateLabels();
      return false;
    }

    for (const [key, value] of Object.entries(preset)) {
      controls[key].value = value.toFixed(2);
    }

    updateLabels();
    requestDraw();
    return true;
  }

  function applyZoomDelta(delta) {
    const nextZoom = clampZoomLevel(zoom + delta);
    if (!shouldApplyZoom(zoom, nextZoom)) return;

    const camera = zoomViewAtPoint(zoom, nextZoom, panX, panY, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    showFeedback(`Zoom ${zoomPercentLabel(zoom)}`);
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
    if (activePointers.size < 2) return { x: 0, y: 0 };

    const { first, second } = firstTwoPointerValues(activePointers);
    const firstPoint = toCanvasPoint(first);
    const secondPoint = toCanvasPoint(second);
    return {
      x: (firstPoint.x + secondPoint.x) / 2,
      y: (firstPoint.y + secondPoint.y) / 2
    };
  }

  function pointerDistance() {
    if (activePointers.size < 2) return 0;

    const { first, second } = firstTwoPointerValues(activePointers);
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
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
      const stepsDue = simulationStepBudget(ts - lastTick, interval);
      for (let i = 0; i < stepsDue; i++) step();
      lastTick = nextTickAfterSimulationSteps(lastTick, interval, stepsDue, ts);
    }

    requestAnimationFrame(loop);
  }

  controls.play.addEventListener('click', togglePlay);

  controls.step.addEventListener('click', manualStep);
  controls.randomise.addEventListener('click', randomise);
  controls.invert.addEventListener('click', invertGrid);
  controls.clear.addEventListener('click', confirmOrClearGrid);
  controls.paintMode.addEventListener('click', () => setTool('paint'));
  controls.eraseMode.addEventListener('click', () => setTool('erase'));
  controls.zoomIn.addEventListener('click', () => applyZoomDelta(0.2));
  controls.zoomOut.addEventListener('click', () => applyZoomDelta(-0.2));
  controls.resetView.addEventListener('click', resetView);
  controls.frameView.addEventListener('click', frameLiveCells);
  controls.controlsToggle.addEventListener('click', () => setControlsCollapsed(!controlsCollapsed));
  controls.gridSize.addEventListener('input', () => {
    resizeBuffers(Number(controls.gridSize.value));
    updateLabels();
    if (controls.patternPreset.value) applyPattern(controls.patternPreset.value);
    else seedVisiblePattern();
  });
  controls.patternPreset.addEventListener('change', () => {
    applyPattern(controls.patternPreset.value);
    updateLabels();
  });
  controls.brushMode.addEventListener('change', () => {
    updateLabels();
    if (shouldRedrawBrushModeChange(hoverCell)) requestDraw();
  });
  controls.rulePreset.addEventListener('change', () => {
    applyRulePreset(controls.rulePreset.value);
  });

  for (const key of ['ageLimit', 'density', 'hue', 'saturation', 'discoMode', 'timeEcho', 'speed', 'under', 'survive', 'over', 'birth', 'noise']) {
    controls[key].addEventListener('input', () => {
      if (['under', 'survive', 'over', 'birth', 'noise'].includes(key)) {
        controls.rulePreset.value = '';
      }
      if (key === 'hue' || key === 'saturation') colourDirty = true;
      if (key === 'timeEcho' && !controls.timeEcho.checked) echo.fill(0);
      updateLabels();
      if (shouldRedrawForControlInput(key, controls.discoMode.checked)) requestGridDraw();
    });
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    activePointers.set(e.pointerId, e);
    capturePointer(e.pointerId);

    if (activePointers.size >= 2) {
      isDrawing = false;
      isPanning = false;
      tapCandidate = null;
      pinchGestureActive = true;
      updateShellMode();
      pinchStartDistance = pointerDistance();
      pinchStartZoom = zoom;
      pinchStartPanX = panX;
      pinchStartPanY = panY;
      pinchStartMidpoint = pointerMidpoint();
      return;
    }

    if (shouldPanPointer(e)) {
      hoverCell = null;
      isDrawing = false;
      isPanning = true;
      tapCandidate = null;
      lastPanPoint = toCanvasPoint(e);
      updateShellMode();
      return;
    }

    const tapPoint = toCanvasPoint(e);
    const tapTime = e.timeStamp || Date.now();
    if (shouldResetViewTap(lastTapTime, lastTapPoint, tapTime, tapPoint)) {
      lastTapTime = 0;
      lastTapPoint = null;
      tapCandidate = null;
      resetView();
      return;
    }
    tapCandidate = { pointerId: e.pointerId, time: tapTime, point: tapPoint };

    isDrawing = true;
    strokeChangedIndices.clear();
    strokeFeedbackTool = effectivePaintTool(tool, e.altKey);
    strokeStrengthTool = strokeFeedbackTool;
    hoverCell = null;
    updateShellMode();
    strokePaintStates.clear();
    lastPaintPoint = null;
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
      const previous = { zoom, panX, panY };
      zoom = dragged.zoom;
      panX = dragged.panX;
      panY = dragged.panY;
      if (!cameraChanged(previous, dragged)) return;
      requestDraw();
      return;
    }

    if (isPanning) {
      e.preventDefault();
      panFromPointer(e);
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();
    if (tapCandidate?.pointerId === e.pointerId) {
      const current = toCanvasPoint(e);
      if (distanceSquared(current.x - tapCandidate.point.x, current.y - tapCandidate.point.y) > 24 ** 2) {
        tapCandidate = null;
      }
    }
    paint(e);
  }, { passive: false });

  canvas.addEventListener('pointermove', e => {
    if (activePointers.size > 0 || e.pointerType !== 'mouse') return;
    updateHoverCell(e);
  });

  canvas.addEventListener('pointerleave', () => {
    if (!shouldClearHoverCell(hoverCell)) return;
    hoverCell = null;
    requestDraw();
  });

  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    activePointers.delete(e.pointerId);
    const completedPinch = pinchGestureActive && activePointers.size < 2;
    const wasDrawing = isDrawing;
    isDrawing = false;
    isPanning = false;
    strokePaintStates.clear();
    lastPaintPoint = null;
    if (tapCandidate?.pointerId === e.pointerId) {
      const tapMemory = tapMemoryFromPointerUp(tapCandidate, e.timeStamp || Date.now(), toCanvasPoint(e));
      lastTapTime = tapMemory.time;
      lastTapPoint = tapMemory.point;
      tapCandidate = null;
    }
    if (wasDrawing) {
      const message = paintStrokeFeedback(strokeFeedbackTool, strokeChangedIndices.size);
      if (message) showFeedback(message);
    } else if (completedPinch) {
      showFeedback(`Zoom ${zoomPercentLabel(zoom)}`);
    }
    if (completedPinch) pinchGestureActive = false;
    strokeChangedIndices.clear();
    updateShellMode();
    releasePointer(e.pointerId);
  }, { passive: false });

  canvas.addEventListener('pointercancel', e => {
    activePointers.delete(e.pointerId);
    isDrawing = false;
    isPanning = false;
    resetStrokeCollections(strokePaintStates, strokeChangedIndices);
    lastPaintPoint = null;
    if (tapCandidate?.pointerId === e.pointerId) tapCandidate = null;
    if (activePointers.size < 2) pinchGestureActive = false;
    updateShellMode();
    releasePointer(e.pointerId);
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const anchorX = ((e.clientX - r.left) / r.width) * canvas.width;
    const anchorY = ((e.clientY - r.top) / r.height) * canvas.height;
    const nextZoom = nextZoomLevel(zoom, e.deltaY);
    if (!shouldApplyZoom(zoom, nextZoom)) return;

    const camera = zoomViewAtPoint(zoom, nextZoom, panX, panY, anchorX, anchorY, canvas.width, canvas.height);
    zoom = camera.zoom;
    panX = camera.panX;
    panY = camera.panY;
    showFeedback(`Zoom ${zoomPercentLabel(zoom)}`);
    requestDraw();
  }, { passive: false });

  window.addEventListener('resize', resizeCanvasToWindow);
  document.addEventListener('visibilitychange', pauseForHiddenTab);
  window.addEventListener('keydown', e => {
    if (shouldIgnoreShortcutTarget(e.target)) return;
    if (e.repeat) return;

    const action = keyboardShortcutAction(e.key);
    if (!action) return;

    e.preventDefault();
    if (action === 'play') togglePlay();
    else if (action === 'pause') pauseSimulation();
    else if (action === 'step') manualStep();
    else if (action === 'randomise') randomise();
    else if (action === 'clear') confirmOrClearGrid();
    else if (action === 'invert') invertGrid();
    else if (action === 'toggle-disco') toggleDiscoMode();
    else if (action === 'toggle-time-echo') toggleTimeEcho();
    else if (action === 'toggle-brush') toggleBrushMode();
    else if (action === 'toggle-tool') setTool(tool === 'paint' ? 'erase' : 'paint');
    else if (action === 'frame-cells') frameLiveCells();
    else if (action === 'paint-tool') setTool('paint');
    else if (action === 'erase-tool') setTool('erase');
    else if (action === 'toggle-controls') setControlsCollapsed(!controlsCollapsed);
    else if (action === 'reset-view') resetView();
    else if (action === 'zoom-in') applyZoomDelta(0.2);
    else if (action === 'zoom-out') applyZoomDelta(-0.2);
  });

  resizeBuffers(size);
  resizeCanvasToWindow();
  seedVisiblePattern();
  requestAnimationFrame(loop);
})();
