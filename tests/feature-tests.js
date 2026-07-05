const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('game.js', 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test('age limit slider exists with default 5 and 0-100 range', () => {
  assert.match(html, /id="ageLimit"/);
  assert.match(html, /id="ageLimit"[^>]*min="0"/);
  assert.match(html, /id="ageLimit"[^>]*max="100"/);
  assert.match(html, /id="ageLimit"[^>]*value="5"/);
  assert.match(html, /id="ageLimitValue"/);
});

test('live cell colour controls exist with useful ranges', () => {
  assert.match(html, /id="hue"[^>]*min="0"/);
  assert.match(html, /id="hue"[^>]*max="360"/);
  assert.match(html, /id="hue"[^>]*value="200"/);
  assert.match(html, /id="hueValue"/);
  assert.match(html, /id="saturation"[^>]*min="0"/);
  assert.match(html, /id="saturation"[^>]*max="100"/);
  assert.match(html, /id="saturation"[^>]*value="85"/);
  assert.match(html, /id="saturationValue"/);
});

test('live cell colour blends from white to selected hue', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testHsl = hslToRgb; window.__testBlend = blendLiveCellColour;`, sandbox);

  const red = sandbox.window.__testHsl(0, 1, 0.5);
  assert.deepStrictEqual({ ...red }, { r: 255, g: 0, b: 0 });
  assert.deepStrictEqual({ ...sandbox.window.__testBlend(0, red) }, { r: 255, g: 255, b: 255 });
  assert.deepStrictEqual({ ...sandbox.window.__testBlend(1, red) }, { ...red });
  assert.deepStrictEqual({ ...sandbox.window.__testBlend(0.5, red) }, { r: 255, g: 128, b: 128 });
});

test('disco mode cycles cells through the seven rainbow colours each generation', () => {
  assert.match(html, /id="discoMode"[^>]*type="checkbox"/);
  assert.match(html, /id="discoModeValue"/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testRainbow = rainbowCellColour; window.__testLiveColour = liveCellColour; window.__testBlend = blendLiveCellColour;`, sandbox);

  const generationZero = sandbox.window.__testRainbow(0, 0);
  const generationOne = sandbox.window.__testRainbow(0, 1);
  const generationSeven = sandbox.window.__testRainbow(0, 7);
  assert.notDeepStrictEqual({ ...generationZero }, { ...generationOne });
  assert.deepStrictEqual({ ...generationZero }, { ...generationSeven });
  assert.deepStrictEqual({ ...sandbox.window.__testLiveColour(0, 1, true, { r: 1, g: 2, b: 3 }) }, { ...generationOne });
  assert.deepStrictEqual({ ...sandbox.window.__testLiveColour(0, 1, false, { r: 1, g: 2, b: 3 }) }, { r: 1, g: 2, b: 3 });
  assert.deepStrictEqual({ ...sandbox.window.__testBlend(0.05, generationOne, true) }, { r: 255, g: 255, b: 255 });
});

test('view reset, zoom status, and preset pattern controls exist', () => {
  assert.match(html, /id="resetView"/);
  assert.match(html, /id="zoomLevel"/);
  assert.match(html, /id="liveCount"/);
  assert.match(html, /id="livePercent"/);
  assert.match(html, /id="runStatus"/);
  assert.match(html, /id="patternPreset"/);
  assert.match(html, /value="glider"/);
  assert.match(html, /value="blinker"/);
  assert.match(html, /value="lwss"/);
  assert.match(html, /value="rPentomino"/);
  assert.match(html, /value="acorn"/);
  assert.match(html, /value="diehard"/);
  assert.match(html, /value="toad"/);
  assert.match(html, /value="pulsar"/);
  assert.match(html, /value="beacon"/);
  assert.match(html, /value="clock"/);
  assert.match(html, /value="gosperGun"/);
  assert.match(html, /value="random-soup"/);
  assert.match(js, /function resetView/);
  assert.match(js, /function applyPattern/);
});

test('preset labels show readable names instead of raw values', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPresetName = displayPresetName;`, sandbox);

  assert.strictEqual(sandbox.window.__testPresetName(''), 'none');
  assert.strictEqual(sandbox.window.__testPresetName('rPentomino'), 'R-pentomino');
  assert.strictEqual(sandbox.window.__testPresetName('random-soup'), 'Random soup');
});

test('rule presets expose useful probability rule sets', () => {
  assert.match(html, /id="rulePreset"/);
  assert.match(html, /id="rulePresetValue"/);
  assert.match(html, /value="classic"/);
  assert.match(html, /value="calm"/);
  assert.match(html, /value="chaotic"/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testRulePreset = rulePresetValues;`, sandbox);

  assert.deepStrictEqual({ ...sandbox.window.__testRulePreset('calm') }, {
    under: 0,
    survive: 1,
    over: 0,
    birth: 1,
    noise: 0
  });
  assert.strictEqual(sandbox.window.__testRulePreset('missing'), null);
});

test('random density and guide grid optimisation helpers exist', () => {
  assert.match(html, /id="density"[^>]*min="0.05"/);
  assert.match(html, /id="density"[^>]*max="0.75"/);
  assert.match(html, /id="density"[^>]*value="0.28"/);
  assert.match(html, /id="densityValue"/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testGuide = shouldDrawGuideGrid; window.__testVisibleLines = visibleGridLineRange;`, sandbox);

  assert.strictEqual(sandbox.window.__testGuide(6, 6), true);
  assert.strictEqual(sandbox.window.__testGuide(5.99, 6), false);
  assert.deepStrictEqual({ ...sandbox.window.__testVisibleLines(-120, 20, 50, 300) }, { first: 6, last: 21 });
  assert.deepStrictEqual({ ...sandbox.window.__testVisibleLines(0, 0, 50, 300) }, { first: 0, last: 0 });
});

test('neighbour counter wraps edges without per-cell loop overhead', () => {
  const sandbox = { window: {}, console, Uint8Array };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testCountNeighbours = countCollapsedNeighbours;`, sandbox);

  const cells = new Uint8Array(9);
  cells[2] = 1;
  cells[6] = 1;
  cells[8] = 1;

  assert.strictEqual(sandbox.window.__testCountNeighbours(cells, 3, 0, 0), 3);
  assert.strictEqual(sandbox.window.__testCountNeighbours(cells, 3, 1, 1), 3);
});

test('seed distance helper avoids square root work in the default pattern', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testDistanceSquared = distanceSquared;`, sandbox);

  assert.strictEqual(sandbox.window.__testDistanceSquared(3, 4), 25);
  assert.match(js, /distanceSquared\(dx, dy\)/);
});

test('invert control flips probabilities and keeps ages sensible', () => {
  assert.match(html, /id="invert"/);
  assert.match(js, /function invertGrid/);

  const sandbox = { window: {}, console, Float32Array, Uint16Array, Math };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testInvert = invertProbabilityGrid;`, sandbox);

  const values = new Float32Array([0, 0.25, 1]);
  const ages = new Uint16Array([0, 4, 7]);
  sandbox.window.__testInvert(values, ages);

  assert.deepStrictEqual([...values].map(value => Number(value.toFixed(2))), [1, 0.75, 0]);
  assert.deepStrictEqual([...ages], [1, 4, 0]);
});

test('keyboard shortcuts expose common actions', () => {
  assert.match(html, /Space play\/pause/);
  assert.match(html, /I invert/);
  assert.match(html, /D disco/);
  assert.match(html, /E paint\/erase/);
  assert.match(html, /H hide\/show controls/);
  assert.match(html, /Z reset view/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShortcut = keyboardShortcutAction;`, sandbox);

  assert.strictEqual(sandbox.window.__testShortcut(' '), 'play');
  assert.strictEqual(sandbox.window.__testShortcut('S'), 'step');
  assert.strictEqual(sandbox.window.__testShortcut('r'), 'randomise');
  assert.strictEqual(sandbox.window.__testShortcut('c'), 'clear');
  assert.strictEqual(sandbox.window.__testShortcut('e'), 'toggle-tool');
  assert.strictEqual(sandbox.window.__testShortcut('i'), 'invert');
  assert.strictEqual(sandbox.window.__testShortcut('d'), 'toggle-disco');
  assert.strictEqual(sandbox.window.__testShortcut('H'), 'toggle-controls');
  assert.strictEqual(sandbox.window.__testShortcut('z'), 'reset-view');
  assert.strictEqual(sandbox.window.__testShortcut('x'), null);
});

test('preset patterns are centred and have expected live cell counts', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPattern = patternCells;`, sandbox);

  assert.strictEqual(sandbox.window.__testPattern('glider', 50).length, 5);
  assert.strictEqual(sandbox.window.__testPattern('blinker', 50).length, 3);
  assert.strictEqual(sandbox.window.__testPattern('lwss', 50).length, 9);
  assert.strictEqual(sandbox.window.__testPattern('rPentomino', 50).length, 5);
  assert.strictEqual(sandbox.window.__testPattern('acorn', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('diehard', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('toad', 50).length, 6);
  assert.strictEqual(sandbox.window.__testPattern('pulsar', 50).length, 48);
  assert.strictEqual(sandbox.window.__testPattern('beacon', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('clock', 50).length, 8);
  assert.strictEqual(sandbox.window.__testPattern('gosperGun', 50).length, 36);
});

test('stats expose the active drawing tool', () => {
  assert.match(html, /id="toolStatus"/);
  assert.match(html, /Tool:/);
  assert.match(js, /labels\.toolStatus\.textContent = t === 'paint' \? 'Paint' : 'Erase';/);
});

test('simulation step counts neighbours directly without wrapper overhead', () => {
  assert.doesNotMatch(js, /function neighbours/);
  assert.match(js, /const n = countCollapsedNeighbours\(collapsed, size, x, y\);/);
});

test('live percentage helper formats the current filled area', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPopulationPercent = populationPercent;`, sandbox);

  assert.strictEqual(sandbox.window.__testPopulationPercent(25, 100), '25.0%');
  assert.strictEqual(sandbox.window.__testPopulationPercent(1, 3), '33.3%');
  assert.strictEqual(sandbox.window.__testPopulationPercent(5, 0), '0.0%');
});

test('cancelled pointers release capture to avoid stuck touch state', () => {
  assert.match(js, /pointercancel/);
  assert.match(js, /pointercancel[\s\S]*releasePointer\(e\.pointerId\)/);
});

test('cells older than the configured limit are forced to die', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testAge = shouldCellAgeOut; window.__testNextAge = nextCellAge;`, sandbox);

  assert.strictEqual(sandbox.window.__testAge(6, 5), true);
  assert.strictEqual(sandbox.window.__testAge(5, 5), false);
  assert.strictEqual(sandbox.window.__testAge(100, 0), false);
  assert.strictEqual(sandbox.window.__testNextAge(false, 0, 0.75), 1);
  assert.strictEqual(sandbox.window.__testNextAge(true, 4, 0.75), 5);
  assert.strictEqual(sandbox.window.__testNextAge(true, 4, 0), 0);
});

test('browser zoom state is constrained to a useful range', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testClampZoom = clampZoomLevel; window.__testZoom = nextZoomLevel; window.__testPinch = nextPinchZoomLevel; window.__testZoomAt = zoomViewAtPoint; window.__testDrag = dragView; window.__testMap = screenToGridPoint;`, sandbox);

  assert.strictEqual(sandbox.window.__testClampZoom(1.234), 1.23);
  assert.strictEqual(sandbox.window.__testClampZoom(4.5), 4);
  assert.strictEqual(sandbox.window.__testZoom(1, -100), 1.1);
  assert.strictEqual(sandbox.window.__testZoom(1, 100), 0.9);
  assert.strictEqual(sandbox.window.__testZoom(4, -100), 4);
  assert.strictEqual(sandbox.window.__testZoom(0.25, 100), 0.25);
  assert.strictEqual(sandbox.window.__testPinch(1, 100, 150), 1.5);
  assert.strictEqual(sandbox.window.__testPinch(1.5, 150, 100), 1);
  assert.strictEqual(sandbox.window.__testPinch(4, 100, 150), 4);
});

test('camera zoom keeps the touched grid point under the fingers', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testZoomAt = zoomViewAtPoint; window.__testMap = screenToGridPoint;`, sandbox);

  const before = sandbox.window.__testMap(600, 400, 50, 1200, 800, 1, 0, 0);
  const camera = sandbox.window.__testZoomAt(1, 2, 0, 0, 600, 400, 1200, 800);
  const after = sandbox.window.__testMap(600, 400, 50, 1200, 800, camera.zoom, camera.panX, camera.panY);

  assert.deepStrictEqual({ ...after }, { ...before });
  assert.deepStrictEqual({ ...camera }, { zoom: 2, panX: -600, panY: -400 });
});

test('two finger drag pans the zoomed grid view', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testDrag = dragView;`, sandbox);

  assert.deepStrictEqual({ ...sandbox.window.__testDrag(2, -600, -400, 60, -30, 1200, 800) }, {
    zoom: 2,
    panX: -540,
    panY: -430
  });
});

test('mobile zoom controls exist beside the grid', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(html, /id="zoomIn"/);
  assert.match(html, /id="zoomOut"/);
  assert.match(js, /applyZoomDelta/);
  assert.match(js, /const nextZoom = clampZoomLevel\(zoom \+ delta\);/);
  assert.match(js, /nextPinchZoomLevel/);
  assert.match(css, /\.zoomControls\s*{/);
});

test('drawing avoids rainbow colour lookup when disco mode is off', () => {
  assert.match(js, /const liveColour = discoMode \? rainbowCellColour\(i, generation\) : selectedLiveColour;/);
});

test('static labels are not rewritten on every animation draw', () => {
  assert.match(js, /let labelsDirty = true;/);
  assert.match(js, /if \(labelsDirty\) updateLabels\(\);/);
  assert.match(js, /labelsDirty = false;/);
});

test('controls can collapse into a compact drawer', () => {
  assert.match(html, /id="controlsToggle"/);
  assert.match(html, /aria-controls="controlsPanel"/);
  assert.match(html, /id="controlsPanel"/);
  assert.match(js, /setControlsCollapsed/);
});

test('controls panel is compact and positioned beside the grid', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.ui\s*{/);
  assert.match(css, /\.panel\s*{[^}]*max-width:\s*360px/s);
  assert.match(css, /\.panel\.collapsed\s+\.controlsGrid\s*{[^}]*display:\s*none/s);
});

test('game initialises against a browser-sized canvas without runtime errors', () => {
  const elements = new Map();
  const rafQueue = [];
  const context = {
    imageSmoothingEnabled: true,
    createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: () => {},
    clearRect: () => {},
    drawImage: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {}
  };

  function makeElement(id) {
    return {
      id,
      value: ({ gridSize: '50', ageLimit: '5', density: '0.28', patternPreset: '', rulePreset: 'classic', hue: '200', saturation: '85', speed: '8', under: '0.10', survive: '0.90', over: '0.75', birth: '0.75', noise: '0.02' })[id] || '',
      checked: false,
      textContent: '',
      classList: { toggle: () => {} },
      addEventListener: () => {},
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }),
      getContext: () => context
    };
  }

  const sandbox = {
    console,
    Uint8ClampedArray,
    Float32Array,
    Uint8Array,
    Uint16Array,
    Math,
    window: {
      innerWidth: 1200,
      innerHeight: 800,
      devicePixelRatio: 1,
      addEventListener: () => {}
    },
    document: {
      getElementById: id => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
      },
      createElement: () => makeElement('canvas')
    },
    requestAnimationFrame: fn => rafQueue.push(fn)
  };

  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  assert.strictEqual(elements.get('world').width, 1200);
  assert.strictEqual(elements.get('world').height, 800);
  assert.ok(rafQueue.length > 0);
});
