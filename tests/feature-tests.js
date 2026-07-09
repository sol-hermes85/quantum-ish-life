const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('game.js', 'utf8');
const README = fs.readFileSync('README.md', 'utf8');

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
  assert.match(html, /value="trafficLight"/);
  assert.match(html, /value="lwss"/);
  assert.match(html, /value="rPentomino"/);
  assert.match(html, /value="smallExploder"/);
  assert.match(html, /value="acorn"/);
  assert.match(html, /value="diehard"/);
  assert.match(html, /value="loaf"/);
  assert.match(html, /value="block"/);
  assert.match(html, /value="toad"/);
  assert.match(html, /value="cross"/);
  assert.match(html, /value="diamond"/);
  assert.match(html, /value="boat"/);
  assert.match(html, /value="tub"/);
  assert.match(html, /value="pulsar"/);
  assert.match(html, /value="beacon"/);
  assert.match(html, /value="clock"/);
  assert.match(html, /value="pentadecathlon"/);
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
  assert.strictEqual(sandbox.window.__testPresetName('trafficLight'), 'Traffic light');
  assert.strictEqual(sandbox.window.__testPresetName('smallExploder'), 'Small exploder');
  assert.strictEqual(sandbox.window.__testPresetName('loaf'), 'Loaf');
  assert.strictEqual(sandbox.window.__testPresetName('block'), 'Block');
  assert.strictEqual(sandbox.window.__testPresetName('cross'), 'Cross');
  assert.strictEqual(sandbox.window.__testPresetName('diamond'), 'Diamond');
  assert.strictEqual(sandbox.window.__testPresetName('boat'), 'Boat');
  assert.strictEqual(sandbox.window.__testPresetName('tub'), 'Tub');
  assert.strictEqual(sandbox.window.__testPresetName('pentadecathlon'), 'Pentadecathlon');
  assert.strictEqual(sandbox.window.__testPresetName('random-soup'), 'Random soup');
});

test('preset labels can include live cell counts for selected patterns', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPresetLabel = patternPresetLabel;`, sandbox);

  assert.strictEqual(sandbox.window.__testPresetLabel('', 50), 'none');
  assert.strictEqual(sandbox.window.__testPresetLabel('random-soup', 50), 'Random soup');
  assert.strictEqual(sandbox.window.__testPresetLabel('boat', 50), 'Boat (5 cells)');
  assert.strictEqual(sandbox.window.__testPresetLabel('tub', 50), 'Tub (4 cells)');
  assert.strictEqual(sandbox.window.__testPresetLabel('pentadecathlon', 50), 'Pentadecathlon (12 cells)');
});

test('rule presets expose useful probability rule sets', () => {
  assert.match(html, /id="rulePreset"/);
  assert.match(html, /id="rulePresetValue"/);
  assert.match(html, /value="classic"/);
  assert.match(html, /value="calm"/);
  assert.match(html, /value="highlife"/);
  assert.match(html, /value="spark"/);
  assert.match(html, /value="chaotic"/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testRulePreset = rulePresetValues; window.__testRulePresetName = displayRulePresetName;`, sandbox);

  assert.deepStrictEqual({ ...sandbox.window.__testRulePreset('calm') }, {
    under: 0,
    survive: 1,
    over: 0,
    birth: 1,
    noise: 0
  });
  assert.deepStrictEqual({ ...sandbox.window.__testRulePreset('spark') }, {
    under: 0.20,
    survive: 0.80,
    over: 0.35,
    birth: 0.90,
    noise: 0.05
  });
  assert.deepStrictEqual({ ...sandbox.window.__testRulePreset('highlife') }, {
    under: 0.10,
    survive: 0.92,
    over: 0.70,
    birth: 0.88,
    noise: 0.01
  });
  assert.strictEqual(sandbox.window.__testRulePresetName('classic'), 'Classic-ish');
  assert.strictEqual(sandbox.window.__testRulePresetName('highlife'), 'HighLife-ish');
  assert.strictEqual(sandbox.window.__testRulePresetName(''), 'custom');
  assert.strictEqual(sandbox.window.__testRulePreset('missing'), null);
});

test('rule preset control explains that presets move related sliders together', () => {
  assert.match(html, /Rule presets tune survival, birth, and noise sliders together/);
  assert.match(html, /Rule presets move the survival, birth, and noise sliders together/);
});

test('random density and guide grid optimisation helpers exist', () => {
  assert.match(html, /id="density"[^>]*min="0.05"/);
  assert.match(html, /id="density"[^>]*max="0.75"/);
  assert.match(html, /id="density"[^>]*value="0.28"/);
  assert.match(html, /id="densityValue"/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testGuide = shouldDrawGuideGrid; window.__testGuideOpacity = guideGridOpacity; window.__testVisibleLines = visibleGridLineRange;`, sandbox);

  assert.strictEqual(sandbox.window.__testGuide(6, 6), true);
  assert.strictEqual(sandbox.window.__testGuide(5.99, 6), false);
  assert.strictEqual(sandbox.window.__testGuideOpacity(5, 5), 0);
  assert.strictEqual(sandbox.window.__testGuideOpacity(6, 6), 0.13);
  assert.strictEqual(sandbox.window.__testGuideOpacity(24, 24), 0.22);
  assert.match(README, /keeps the fine guide grid subtle as cells get larger/);
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
  assert.match(html, /Space\/P play\/pause/);
  assert.match(html, /Esc pause/);
  assert.match(html, /I invert/);
  assert.match(html, /D disco/);
  assert.match(html, /E paint\/erase/);
  assert.match(html, /1 paint, 2 erase/);
  assert.match(html, /H hide\/show controls/);
  assert.match(html, /Z\/Home\/0 reset view/);
  assert.match(html, /\+\/− zoom/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShortcut = keyboardShortcutAction;`, sandbox);

  assert.strictEqual(sandbox.window.__testShortcut(' '), 'play');
  assert.strictEqual(sandbox.window.__testShortcut('Escape'), 'pause');
  assert.strictEqual(sandbox.window.__testShortcut('1'), 'paint-tool');
  assert.strictEqual(sandbox.window.__testShortcut('2'), 'erase-tool');
  assert.strictEqual(sandbox.window.__testShortcut('p'), 'play');
  assert.strictEqual(sandbox.window.__testShortcut('S'), 'step');
  assert.strictEqual(sandbox.window.__testShortcut('r'), 'randomise');
  assert.strictEqual(sandbox.window.__testShortcut('c'), 'clear');
  assert.strictEqual(sandbox.window.__testShortcut('e'), 'toggle-tool');
  assert.strictEqual(sandbox.window.__testShortcut('i'), 'invert');
  assert.strictEqual(sandbox.window.__testShortcut('d'), 'toggle-disco');
  assert.strictEqual(sandbox.window.__testShortcut('H'), 'toggle-controls');
  assert.strictEqual(sandbox.window.__testShortcut('Home'), 'reset-view');
  assert.strictEqual(sandbox.window.__testShortcut('z'), 'reset-view');
  assert.strictEqual(sandbox.window.__testShortcut('0'), 'reset-view');
  assert.strictEqual(sandbox.window.__testShortcut('+'), 'zoom-in');
  assert.strictEqual(sandbox.window.__testShortcut('='), 'zoom-in');
  assert.strictEqual(sandbox.window.__testShortcut('-'), 'zoom-out');
  assert.strictEqual(sandbox.window.__testShortcut('x'), null);
});

test('preset patterns are centred and have expected live cell counts', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPattern = patternCells;`, sandbox);

  assert.strictEqual(sandbox.window.__testPattern('glider', 50).length, 5);
  assert.strictEqual(sandbox.window.__testPattern('blinker', 50).length, 3);
  assert.strictEqual(sandbox.window.__testPattern('trafficLight', 50).length, 9);
  assert.strictEqual(sandbox.window.__testPattern('lwss', 50).length, 9);
  assert.strictEqual(sandbox.window.__testPattern('rPentomino', 50).length, 5);
  assert.strictEqual(sandbox.window.__testPattern('smallExploder', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('acorn', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('diehard', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('loaf', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('block', 50).length, 4);
  assert.strictEqual(sandbox.window.__testPattern('toad', 50).length, 6);
  assert.strictEqual(sandbox.window.__testPattern('cross', 50).length, 9);
  assert.strictEqual(sandbox.window.__testPattern('diamond', 50).length, 12);
  assert.strictEqual(sandbox.window.__testPattern('boat', 50).length, 5);
  assert.strictEqual(sandbox.window.__testPattern('tub', 50).length, 4);
  assert.strictEqual(sandbox.window.__testPattern('pulsar', 50).length, 48);
  assert.strictEqual(sandbox.window.__testPattern('beacon', 50).length, 7);
  assert.strictEqual(sandbox.window.__testPattern('clock', 50).length, 8);
  assert.strictEqual(sandbox.window.__testPattern('pentadecathlon', 50).length, 12);
  assert.strictEqual(sandbox.window.__testPattern('gosperGun', 50).length, 36);
});

test('changing grid size preserves the selected pattern instead of reverting to the default seed', () => {
  assert.match(js, /if \(controls\.patternPreset\.value\) applyPattern\(controls\.patternPreset\.value\);/);
  assert.match(js, /else seedVisiblePattern\(\);/);
});

test('stats expose the active drawing tool', () => {
  assert.match(html, /id="toolStatus"/);
  assert.match(html, /Tool:/);
  assert.match(js, /labels\.toolStatus\.textContent = t === 'paint' \? 'Paint' : 'Erase';/);
});

test('paint and erase buttons expose their selected state clearly', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(html, /id="paintMode"[^>]*aria-pressed="true"/);
  assert.match(html, /id="eraseMode"[^>]*aria-pressed="false"/);
  assert.match(js, /controls\.paintMode\.setAttribute\('aria-pressed', String\(t === 'paint'\)\);/);
  assert.match(js, /controls\.eraseMode\.setAttribute\('aria-pressed', String\(t === 'erase'\)\);/);
  assert.match(css, /button\[aria-pressed="true"\]/);
});

test('simulation step counts neighbours directly without wrapper overhead', () => {
  assert.doesNotMatch(js, /function neighbours/);
  assert.match(js, /const n = countCollapsedNeighbours\(collapsed, size, x, y\);/);
});

test('simulation step avoids a per-cell index helper call', () => {
  assert.match(js, /const rowOffset = y \* size;/);
  assert.match(js, /const i = rowOffset \+ x;/);
  assert.doesNotMatch(js, /const i = idx\(x, y\);\n        const alive = collapsed\[i\] === 1;/);
  assert.match(README, /avoids a per-cell index helper call during simulation steps/);
});

test('live percentage helper formats the current filled area', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPopulationPercent = populationPercent;`, sandbox);

  assert.strictEqual(sandbox.window.__testPopulationPercent(25, 100), '25.0%');
  assert.strictEqual(sandbox.window.__testPopulationPercent(1, 3), '33.3%');
  assert.strictEqual(sandbox.window.__testPopulationPercent(5, 0), '0.0%');
});

test('population trend label summarises whether the live count is moving', () => {
  assert.match(html, /Trend:/);
  assert.match(html, /id="populationTrend" aria-live="polite"/);
  assert.match(html, /trend stat shows whether the live population is rising, falling, or steady/);
  assert.match(README, /Trend/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPopulationTrend = populationTrendLabel;`, sandbox);

  assert.strictEqual(sandbox.window.__testPopulationTrend(null, 10), 'steady');
  assert.strictEqual(sandbox.window.__testPopulationTrend(9, 10), 'rising');
  assert.strictEqual(sandbox.window.__testPopulationTrend(11, 10), 'falling');
  assert.strictEqual(sandbox.window.__testPopulationTrend(10, 10), 'steady');
});

test('drag paint strokes report how many cells changed', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPaintFeedback = paintStrokeFeedback;`, sandbox);

  assert.strictEqual(sandbox.window.__testPaintFeedback('paint', 1), 'Painted 1 cell');
  assert.strictEqual(sandbox.window.__testPaintFeedback('paint', 3), 'Painted 3 cells');
  assert.strictEqual(sandbox.window.__testPaintFeedback('erase', 2), 'Erased 2 cells');
  assert.strictEqual(sandbox.window.__testPaintFeedback('erase', 0), '');
  assert.match(js, /strokeChangedCount\+\+/);
  assert.match(html, /paint\/erase stroke counts/);
});

test('stat labels avoid duplicate DOM writes', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testSetText = setTextIfChanged;`, sandbox);

  const element = { textContent: 'same' };
  assert.strictEqual(sandbox.window.__testSetText(element, 'same'), false);
  assert.strictEqual(sandbox.window.__testSetText(element, 'new'), true);
  assert.strictEqual(element.textContent, 'new');
  assert.match(js, /setTextIfChanged\(labels\.zoomLevel, zoomPercentLabel\(zoom\)\);/);
});

test('control labels avoid duplicate DOM writes', () => {
  assert.match(js, /setTextIfChanged\(labels\.gridSize, `\$\{size\} × \$\{size\}`\);/);
  assert.match(js, /setTextIfChanged\(labels\.patternPreset, patternPresetLabel\(controls\.patternPreset\.value, size\)\);/);
  assert.match(js, /setTextIfChanged\(labels\[key\], Number\(controls\[key\]\.value\)\.toFixed\(2\)\);/);
  assert.match(README, /stat\/control-label/);
});

test('mobile controls wrap to four columns for larger tap targets', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.buttons \{[\s\S]*grid-template-columns: repeat\(4, 1fr\);/);
});

test('average stat label explains that it is a probability average', () => {
  assert.match(html, /Avg probability:/);
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

test('zoom feedback uses the same rounded percent label as the stats panel', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testZoomPercent = zoomPercentLabel;`, sandbox);

  assert.strictEqual(sandbox.window.__testZoomPercent(1), '100%');
  assert.strictEqual(sandbox.window.__testZoomPercent(1.234), '123%');
  assert.match(js, /setTextIfChanged\(labels\.zoomLevel, zoomPercentLabel\(zoom\)\);/);
  assert.match(js, /showFeedback\(`Zoom \$\{zoomPercentLabel\(zoom\)\}`\);/);
  assert.match(html, /main mode, zoom, or grid content changes/);
});

test('browser tab title reflects whether the simulation is running', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPageTitle = pageTitleForState;`, sandbox);

  assert.strictEqual(sandbox.window.__testPageTitle(false, 0), 'Paused · Gen 0 · Quantum-ish Life');
  assert.strictEqual(sandbox.window.__testPageTitle(true, 12), 'Running · Gen 12 · Quantum-ish Life');
  assert.match(js, /setDocumentTitleIfChanged\(document, pageTitleForState\(running, generation\)\);/);
});

test('resuming play resets the simulation clock for a smooth first tick', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testNextTick = nextTickTimestampOnResume;`, sandbox);

  assert.strictEqual(sandbox.window.__testNextTick(false, true, 1234, 50), 1234);
  assert.strictEqual(sandbox.window.__testNextTick(true, false, 1234, 50), 50);
  assert.strictEqual(sandbox.window.__testNextTick(true, true, 1234, 50), 50);
  assert.match(js, /lastTick = nextTickTimestampOnResume\(previousRunning, running, performance\.now\(\), lastTick\);/);
  assert.match(README, /resets the simulation clock on resume/);
});

test('playing on small screens folds tuning controls away', () => {
  assert.match(html, /On small screens, Play folds the tuning controls away/);
  assert.match(README, /Mobile play view/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testAutoCollapse = shouldAutoCollapseControlsOnPlay;`, sandbox);

  assert.strictEqual(sandbox.window.__testAutoCollapse(true, 640, false), true);
  assert.strictEqual(sandbox.window.__testAutoCollapse(true, 641, false), false);
  assert.strictEqual(sandbox.window.__testAutoCollapse(true, 640, true), false);
  assert.strictEqual(sandbox.window.__testAutoCollapse(false, 640, false), false);
  assert.match(js, /if \(shouldAutoCollapseControlsOnPlay\(running, window\.innerWidth, controlsCollapsed\)\) setControlsCollapsed\(true\);/);
});

test('hidden tabs pause the simulation to avoid background battery drain', () => {
  assert.match(html, /Hidden tabs pause automatically to save battery/);
  assert.match(README, /Hidden tabs/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testHiddenPause = shouldPauseWhenHidden;`, sandbox);

  assert.strictEqual(sandbox.window.__testHiddenPause(true, 'hidden'), true);
  assert.strictEqual(sandbox.window.__testHiddenPause(true, 'visible'), false);
  assert.strictEqual(sandbox.window.__testHiddenPause(false, 'hidden'), false);
  assert.match(js, /document\.addEventListener\('visibilitychange', pauseForHiddenTab\);/);
});

test('motion polish respects reduced motion preferences', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition-duration:\s*0\.01ms !important/);
  assert.match(css, /animation-duration:\s*0\.01ms !important/);
});

test('running state adds a subtle grid colour wash', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.canvasShell\.running::after/);
  assert.match(js, /controls\.shell\.classList\.toggle\('running', running\);/);
  assert.match(README, /Running state/);
});

test('double-click or double-tap on the grid can reset the view', () => {
  assert.match(html, /Double-click or double-tap resets the view/);
  assert.match(html, /Double-tap the grid to reset the view/);
  assert.match(html, /Home\/0 from the keyboard/);
  assert.match(js, /function shouldResetViewTap/);
  assert.match(js, /resetView\(\);/);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testResetTap = shouldResetViewTap;`, sandbox);

  assert.strictEqual(sandbox.window.__testResetTap(100, { x: 20, y: 20 }, 300, { x: 30, y: 30 }), true);
  assert.strictEqual(sandbox.window.__testResetTap(100, { x: 20, y: 20 }, 500, { x: 30, y: 30 }), false);
  assert.strictEqual(sandbox.window.__testResetTap(100, { x: 20, y: 20 }, 300, { x: 80, y: 20 }), false);
});

test('tap reset memory uses pointer-up timing and location', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testTapMemory = tapMemoryFromPointerUp;`, sandbox);

  const memory = sandbox.window.__testTapMemory({ time: 100, point: { x: 10, y: 10 } }, 260, { x: 14, y: 12 });
  assert.deepStrictEqual({ ...memory, point: { ...memory.point } }, { time: 260, point: { x: 14, y: 12 } });
  assert.match(js, /tapMemoryFromPointerUp\(tapCandidate, e\.timeStamp \|\| Date\.now\(\), toCanvasPoint\(e\)\)/);
});

test('no-op zoom input is ignored at zoom limits', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShouldZoom = shouldApplyZoom;`, sandbox);

  assert.strictEqual(sandbox.window.__testShouldZoom(4, 4), false);
  assert.strictEqual(sandbox.window.__testShouldZoom(0.25, 0.25), false);
  assert.strictEqual(sandbox.window.__testShouldZoom(1, 1.1), true);
  assert.match(js, /if \(!shouldApplyZoom\(zoom, nextZoom\)\) return;/);
});

test('zoom buttons dim when the camera reaches its limits', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testDisableZoom = shouldDisableZoomControl; window.__testSetDisabled = setDisabledIfChanged;`, sandbox);

  assert.strictEqual(sandbox.window.__testDisableZoom(0.25, -1), true);
  assert.strictEqual(sandbox.window.__testDisableZoom(0.26, -1), false);
  assert.strictEqual(sandbox.window.__testDisableZoom(4, 1), true);
  assert.strictEqual(sandbox.window.__testDisableZoom(3.99, 1), false);

  const button = { disabled: false };
  assert.strictEqual(sandbox.window.__testSetDisabled(button, false), false);
  assert.strictEqual(sandbox.window.__testSetDisabled(button, true), true);
  assert.strictEqual(button.disabled, true);

  assert.match(js, /function updateZoomControlState/);
  assert.match(js, /setDisabledIfChanged\(controls\.zoomOut, shouldDisableZoomControl\(zoom, -1\)\);/);
  assert.match(css, /button:disabled/);
  assert.match(README, /zoom buttons dim when the view is already at its limit/);
});

test('reset view skips feedback and redraw work when already reset', () => {
  assert.match(js, /const previous = \{ zoom, panX, panY \};/);
  assert.match(js, /if \(!cameraChanged\(previous, camera\)\) return;/);
  assert.match(README, /avoids redundant reset-view/);
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

test('panning skips redraw work when the clamped camera does not move', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testCameraChanged = cameraChanged;`, sandbox);

  assert.strictEqual(sandbox.window.__testCameraChanged({ zoom: 1, panX: 0, panY: 0 }, { zoom: 1, panX: 0, panY: 0 }), false);
  assert.strictEqual(sandbox.window.__testCameraChanged({ zoom: 2, panX: -5, panY: 0 }, { zoom: 2, panX: -6, panY: 0 }), true);
  assert.match(js, /if \(!cameraChanged\(previous, camera\)\) return;/);
});

test('desktop pointer users can pan without painting', () => {
  assert.match(html, /Shift-drag, middle-drag, or right-drag pans the grid/);
  assert.match(js, /function shouldPanPointer/);
  assert.match(js, /event\.button === 1 \|\| event\.button === 2 \|\| event\.shiftKey/);
  assert.match(js, /function panFromPointer/);
  assert.match(js, /canvas\.addEventListener\('contextmenu'/);
});

test('drag painting skips duplicate cell writes', () => {
  assert.match(js, /let lastPaintIndex = -1;/);
  assert.match(js, /if \(i === lastPaintIndex\) return false;/);
  assert.match(js, /lastPaintIndex = i;/);
});

test('painting skips cells already in the requested state', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testInside = isGridPointInside; window.__testShouldUpdateCell = shouldUpdateCell;`, sandbox);

  assert.strictEqual(sandbox.window.__testInside({ x: 0, y: 0 }, 50), true);
  assert.strictEqual(sandbox.window.__testInside({ x: 50, y: 0 }, 50), false);
  assert.strictEqual(sandbox.window.__testShouldUpdateCell(1, 'paint'), false);
  assert.strictEqual(sandbox.window.__testShouldUpdateCell(0.5, 'paint'), true);
  assert.strictEqual(sandbox.window.__testShouldUpdateCell(0, 'erase'), false);
  assert.match(js, /if \(!shouldUpdateCell\(grid\[i\], paintTool\)\) return false;/);
});

test('alt-drag temporarily flips the active paint tool', () => {
  assert.match(html, /Alt-drag temporarily flips paint and erase/);
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testEffectivePaintTool = effectivePaintTool;`, sandbox);

  assert.strictEqual(sandbox.window.__testEffectivePaintTool('paint', false), 'paint');
  assert.strictEqual(sandbox.window.__testEffectivePaintTool('paint', true), 'erase');
  assert.strictEqual(sandbox.window.__testEffectivePaintTool('erase', true), 'paint');
  assert.match(js, /const paintTool = effectivePaintTool\(tool, e\.altKey\);/);
});

test('desktop hover preview follows the temporary alt paint tool', () => {
  assert.match(html, /Alt-drag temporarily flips paint and erase/);
  assert.match(js, /let hoverPreviewTool = 'paint';/);
  assert.match(js, /const nextHoverPreviewTool = effectivePaintTool\(tool, e\.altKey\);/);
  assert.match(js, /hoverPreviewTool = nextHoverPreviewTool;/);
  assert.match(js, /hoverPreviewTool === 'erase'/);
});

test('fast drag painting interpolates grid cells so strokes do not leave gaps', () => {
  assert.match(html, /Fast drags fill the gaps between cells/);
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testInterpolatedGridPoints = interpolatedGridPoints;`, sandbox);

  const normalise = points => JSON.parse(JSON.stringify(points));

  assert.deepStrictEqual(normalise(sandbox.window.__testInterpolatedGridPoints(null, { x: 2, y: 3 })), [{ x: 2, y: 3 }]);
  assert.deepStrictEqual(normalise(sandbox.window.__testInterpolatedGridPoints({ x: 0, y: 0 }, { x: 3, y: 0 })), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 }
  ]);
  assert.deepStrictEqual(normalise(sandbox.window.__testInterpolatedGridPoints({ x: 0, y: 0 }, { x: 2, y: 2 })), [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 }
  ]);
  assert.match(js, /for \(const point of interpolatedGridPoints\(lastPaintPoint, p\)\)/);
});

test('desktop mouse hover previews the cell that will be painted', () => {
  assert.match(js, /let hoverCell = null;/);
  assert.match(js, /function drawHoverPreview/);
  assert.match(js, /function updateHoverCell/);
  assert.match(js, /e\.pointerType !== 'mouse'/);
  assert.match(js, /ctx\.fillRect/);
  assert.match(js, /ctx\.strokeRect/);
});

test('hover preview fills the target cell so the paint target is easier to see', () => {
  assert.match(js, /ctx\.fillStyle = hoverPreviewTool === 'erase'/);
  assert.match(js, /rgba\(255,255,255,0\.28\)/);
});

test('hover preview avoids redraws while the mouse remains in the same cell', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testSameGridPoint = sameGridPoint;`, sandbox);

  assert.strictEqual(sandbox.window.__testSameGridPoint({ x: 2, y: 3 }, { x: 2, y: 3 }), true);
  assert.strictEqual(sandbox.window.__testSameGridPoint({ x: 2, y: 3 }, { x: 3, y: 3 }), false);
  assert.strictEqual(sandbox.window.__testSameGridPoint(null, { x: 2, y: 3 }), false);
  assert.match(js, /if \(sameGridPoint\(hoverCell, nextHoverCell\) && hoverPreviewTool === nextHoverPreviewTool\) return;/);
});

test('hover preview skips cells outside the visible canvas', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testVisibleRect = isRectVisible;`, sandbox);

  assert.strictEqual(sandbox.window.__testVisibleRect(10, 10, 20, 20, 100, 100), true);
  assert.strictEqual(sandbox.window.__testVisibleRect(-10, 10, 20, 20, 100, 100), true);
  assert.strictEqual(sandbox.window.__testVisibleRect(-30, 10, 20, 20, 100, 100), false);
  assert.strictEqual(sandbox.window.__testVisibleRect(100, 10, 20, 20, 100, 100), false);
  assert.match(js, /if \(!isRectVisible\(x, y, cellX, cellY, canvas\.width, canvas\.height\)\) return;/);
});

test('leaving the canvas only redraws when a hover preview was visible', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShouldClearHover = shouldClearHoverCell;`, sandbox);

  assert.strictEqual(sandbox.window.__testShouldClearHover(null), false);
  assert.strictEqual(sandbox.window.__testShouldClearHover({ x: 1, y: 2 }), true);
  assert.match(js, /if \(!shouldClearHoverCell\(hoverCell\)\) return;/);
});

test('mode changes can show brief feedback over the grid', () => {
  assert.match(html, /id="feedback"/);
  assert.match(html, /aria-atomic="true"/);
  assert.match(html, /Brief feedback appears over the grid/);
  assert.match(js, /function showFeedback/);
  assert.match(js, /showFeedback\(running \? 'Running' : pauseFeedbackLabel\(generation\)\)/);
  assert.match(js, /showFeedback\('View reset'\)/);
  assert.match(js, /showFeedback\(t === 'paint' \? 'Paint mode' : 'Erase mode'\)/);
});

test('longer feedback messages stay visible briefly longer', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testFeedbackDuration = feedbackDuration;`, sandbox);

  assert.strictEqual(sandbox.window.__testFeedbackDuration('Running'), 900);
  assert.strictEqual(sandbox.window.__testFeedbackDuration('Painted 25 cells'), 900);
  assert.strictEqual(sandbox.window.__testFeedbackDuration('Pentadecathlon loaded'), 1300);
  assert.match(js, /setTimeout\(\(\) => \{[\s\S]*\}, feedbackDuration\(message\)\);/);
});

test('pause feedback includes the generation reached', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testPauseFeedback = pauseFeedbackLabel;`, sandbox);

  assert.strictEqual(sandbox.window.__testPauseFeedback(12), 'Paused · Gen 12');
  assert.match(html, /generation reached when pausing/);
  assert.match(README, /pause with generation context/);
});

test('escape pauses without toggling a stopped simulation back on', () => {
  assert.match(html, /Esc pauses without resetting anything/);
  assert.match(js, /function pauseSimulation\(\)/);
  assert.match(js, /if \(!running\) return;/);
  assert.match(js, /else if \(action === 'pause'\) pauseSimulation\(\);/);
});

test('manual stepping reports the new generation without changing play mode', () => {
  assert.match(js, /function manualStep\(\)/);
  assert.match(js, /manualStep\(\)[\s\S]*step\(\);[\s\S]*showFeedback\(`Gen \$\{generation\}`\);/);
  assert.match(js, /controls\.step\.addEventListener\('click', manualStep\);/);
  assert.match(js, /else if \(action === 'step'\) manualStep\(\);/);
  assert.match(html, /Step shows the new generation/);
});

test('reselecting the active paint tool avoids duplicate mode feedback', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShouldChangeTool = shouldChangeTool;`, sandbox);

  assert.strictEqual(sandbox.window.__testShouldChangeTool('paint', 'paint'), false);
  assert.strictEqual(sandbox.window.__testShouldChangeTool('paint', 'erase'), true);
  assert.match(js, /if \(!shouldChangeTool\(tool, t\)\) return;/);
});

test('button hover states brighten controls without shifting layout', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /button:hover\s*{[^}]*background:\s*rgba\(56, 56, 56, 0\.94\)/s);
  assert.match(css, /button\.primary:hover\s*{[^}]*background:\s*#fff/s);
});

test('grid content actions show clear feedback', () => {
  assert.match(js, /showFeedback\('Randomised'\)/);
  assert.match(js, /showFeedback\('Grid cleared'\)/);
  assert.match(js, /showFeedback\('Grid inverted'\)/);
  assert.match(js, /showFeedback\(`\$\{displayPresetName\(pattern\)\} loaded`\)/);
  assert.match(html, /grid content changes/);
});

test('desktop panning supports shift, middle, and right drag', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShouldPanPointer = shouldPanPointer;`, sandbox);

  assert.strictEqual(sandbox.window.__testShouldPanPointer({ button: 0, shiftKey: true }), true);
  assert.strictEqual(sandbox.window.__testShouldPanPointer({ button: 1, shiftKey: false }), true);
  assert.strictEqual(sandbox.window.__testShouldPanPointer({ button: 2, shiftKey: false }), true);
  assert.strictEqual(sandbox.window.__testShouldPanPointer({ button: 0, shiftKey: false }), false);
  assert.match(html, /middle-drag/);
});

test('controls have subtle motion polish without moving the grid', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.feedback\s*{/);
  assert.match(css, /\.feedback\.visible/);
  assert.match(css, /transition:\s*opacity 160ms ease, transform 160ms ease/);
  assert.match(css, /button:active/);
  assert.match(css, /transition:\s*max-height 180ms ease, background-color 180ms ease/);
});

test('primary controls sit on a subtle glass tray with a clear canvas cursor', () => {
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(css, /canvas\s*{[^}]*cursor:\s*crosshair/s);
  assert.match(css, /\.buttons\s*{[^}]*backdrop-filter:\s*blur\(6px\)/s);
  assert.match(css, /\.buttons\s*{[^}]*border-radius:\s*13px/s);
});

test('canvas cursor reflects erase and panning modes', () => {
  const css = fs.readFileSync('styles.css', 'utf8');

  assert.match(html, /id="shell"/);
  assert.match(html, /cursor changes for erase and pan modes/);
  assert.match(css, /\.canvasShell\.eraseModeActive canvas\s*{[^}]*cursor:\s*cell/s);
  assert.match(css, /\.canvasShell\.panningActive canvas\s*{[^}]*cursor:\s*grabbing/s);
  assert.match(js, /function updateShellMode/);
  assert.match(js, /controls\.shell\.classList\.toggle\('eraseModeActive', tool === 'erase'\)/);
});

test('canvas has a subtle vignette so the full-screen grid feels less stark', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.canvasShell::after/);
  assert.match(css, /radial-gradient/);
  assert.match(css, /pointer-events:\s*none/);
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

test('common controls expose keyboard hints in button titles', () => {
  assert.match(html, /id="play"[^>]*title="Play or pause \(Space\)"/);
  assert.match(html, /id="play"[^>]*aria-pressed="false"/);
  assert.match(html, /id="step"[^>]*title="Advance one generation \(S\)"/);
  assert.match(html, /id="zoomIn"[^>]*title="Zoom in \(\+\)"/);
  assert.match(html, /id="resetView"[^>]*title="Reset view \(Z\)"/);
});

test('play button announces its pressed state while the simulation runs', () => {
  assert.match(js, /controls\.play\.setAttribute\('aria-pressed', String\(running\)\);/);
});

test('resize handler skips redraw work when the browser canvas size is unchanged', () => {
  assert.match(js, /if \(canvas\.width === width && canvas\.height === height\) return;/);
});

test('keyboard users get visible focus outlines on controls', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /button:focus-visible/);
  assert.match(css, /input:focus-visible/);
  assert.match(css, /select:focus-visible/);
  assert.match(css, /outline:\s*3px solid #7dd3fc/);
});

test('range sliders have a larger grab area for touch and trackpads', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /input\[type="range"\],[\s\S]*select \{[\s\S]*min-height:\s*32px/s);
  assert.match(css, /input\[type="range"\]\s*{[^}]*cursor:\s*ew-resize/s);
  assert.match(README, /gives range sliders a larger grab area/);
});

test('mobile control overlays respect safe area insets', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.match(css, /env\(safe-area-inset-right\)/);
  assert.match(css, /left:\s*max\(12px, env\(safe-area-inset-left\)\)/);
});

test('high display pixel ratios are capped to keep canvas work reasonable', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testDpr = effectiveDevicePixelRatio;`, sandbox);

  assert.strictEqual(sandbox.window.__testDpr(3), 2);
  assert.strictEqual(sandbox.window.__testDpr(1.5), 1.5);
  assert.strictEqual(sandbox.window.__testDpr(0), 1);
  assert.match(js, /const dpr = effectiveDevicePixelRatio\(window\.devicePixelRatio\);/);
  assert.match(README, /caps very high display pixel ratios/);
});

test('manual grid actions clear stale preset labels', () => {
  assert.match(js, /function resetPatternSelection\(\)/);
  assert.match(js, /function randomise\(\{ keepPreset = false \} = \{\}\)/);
  assert.match(js, /if \(!keepPreset\) resetPatternSelection\(\);/);
  assert.match(js, /randomise\(\{ keepPreset: true \}\);/);
  assert.match(js, /function clearGrid\(\)[\s\S]*resetPatternSelection\(\);/);
  assert.match(js, /function invertGrid\(\)[\s\S]*resetPatternSelection\(\);/);
});

test('switching rule preset to custom refreshes the label', () => {
  assert.match(js, /controls\.rulePreset\.addEventListener\('change',[\s\S]*applyRulePreset\(controls\.rulePreset\.value\);[\s\S]*updateLabels\(\);[\s\S]*\}\);/);
});

test('drawing avoids rainbow colour lookup when disco mode is off', () => {
  assert.match(js, /gridPixelColour\(p, i, generation, discoMode, liveColour\)/);
  assert.match(js, /const liveColour = discoMode \? rainbowCellColour\(cellIndex, generation\) : selectedLiveColour;/);
});

test('drawing skips palette work for dead cells', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testGridPixelColour = gridPixelColour;`, sandbox);

  assert.deepStrictEqual({ ...sandbox.window.__testGridPixelColour(0, 0, 0, true, null) }, { r: 255, g: 255, b: 255 });
  assert.deepStrictEqual({ ...sandbox.window.__testGridPixelColour(1, 0, 0, false, { r: 10, g: 20, b: 30 }) }, { r: 10, g: 20, b: 30 });
  assert.match(js, /if \(probability >= 1\) return liveColour;/);
});

test('drawing avoids repeated hue conversion and lets disco mode own the palette', () => {
  assert.match(js, /let selectedLiveColour = hslToRgb/);
  assert.match(js, /let colourDirty = false;/);
  assert.match(js, /if \(!discoMode && colourDirty\)/);
  assert.match(js, /const liveColour = discoMode[\s\S]*\? null[\s\S]*: selectedLiveColour/);
  assert.match(js, /if \(key === 'hue' \|\| key === 'saturation'\) colourDirty = true;/);
});

test('hidden colour slider changes avoid redraws while disco mode owns the palette', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testShouldRedrawForControlInput = shouldRedrawForControlInput;`, sandbox);

  assert.strictEqual(sandbox.window.__testShouldRedrawForControlInput('hue', true), false);
  assert.strictEqual(sandbox.window.__testShouldRedrawForControlInput('saturation', true), false);
  assert.strictEqual(sandbox.window.__testShouldRedrawForControlInput('hue', false), true);
  assert.strictEqual(sandbox.window.__testShouldRedrawForControlInput('speed', true), true);
  assert.match(js, /if \(shouldRedrawForControlInput\(key, controls\.discoMode\.checked\)\) requestDraw\(\);/);
  assert.match(README, /avoids redraws for hidden colour changes while disco mode owns the palette/);
});

test('certain collapsed probabilities avoid random number work', () => {
  const sandbox = { window: {}, console, Math };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testCollapseProbability = collapseProbability;`, sandbox);

  assert.strictEqual(sandbox.window.__testCollapseProbability(0), 0);
  assert.strictEqual(sandbox.window.__testCollapseProbability(1), 1);
  assert.match(js, /collapsed\[i\] = collapseProbability\(grid\[i\]\);/);
});

test('zero noise avoids per-cell random number work in the simulation step', () => {
  assert.match(js, /let p = noise > 0 \? noise \* Math\.random\(\) : 0;/);
});

test('pattern preset control warns that choosing a preset replaces the current grid', () => {
  assert.match(html, /id="patternPreset"[^>]*title="Choosing a preset replaces the current grid"/);
});

test('changing stats use polite live regions for assistive technology', () => {
  assert.match(html, /id="generation" aria-live="polite"/);
  assert.match(html, /id="average" aria-live="polite"/);
  assert.match(html, /id="liveCount" aria-live="polite"/);
  assert.match(html, /id="populationTrend" aria-live="polite"/);
  assert.match(html, /id="runStatus" aria-live="polite"/);
});

test('document title updates are skipped when unchanged', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testSetTitle = setDocumentTitleIfChanged;`, sandbox);

  const doc = { title: 'same' };
  assert.strictEqual(sandbox.window.__testSetTitle(doc, 'same'), false);
  assert.strictEqual(sandbox.window.__testSetTitle(doc, 'new'), true);
  assert.strictEqual(doc.title, 'new');
  assert.match(js, /setDocumentTitleIfChanged\(document, pageTitleForState\(running, generation\)\);/);
  assert.match(README, /title, and disabled-button writes/);
});

test('canvas points assistive technology to the play instructions', () => {
  assert.match(html, /id="world"[^>]*aria-describedby="canvasHelp"/);
  assert.match(html, /id="canvasHelp"/);
});

test('held keyboard shortcuts do not auto-repeat destructive actions', () => {
  assert.match(js, /if \(e\.repeat\) return;/);
  assert.match(js, /window\.addEventListener\('keydown'/);
});

test('guide grid batches line drawing into two strokes', () => {
  const guideBody = js.match(/function drawGuideGrid\(\) \{([\s\S]*?)\n  \}/)[1];
  const strokes = guideBody.match(/ctx\.stroke\(\);/g) || [];
  assert.strictEqual(strokes.length, 2);
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
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {}
  };

  function makeElement(id) {
    return {
      id,
      value: ({ gridSize: '50', ageLimit: '5', density: '0.28', patternPreset: '', rulePreset: 'classic', hue: '200', saturation: '85', speed: '8', under: '0.10', survive: '0.90', over: '0.75', birth: '0.75', noise: '0.02' })[id] || '',
      checked: false,
      textContent: '',
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
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
    clearTimeout: () => {},
    setTimeout: () => 1,
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
      createElement: () => makeElement('canvas'),
      addEventListener: () => {}
    },
    requestAnimationFrame: fn => rafQueue.push(fn)
  };

  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  assert.strictEqual(elements.get('world').width, 1200);
  assert.strictEqual(elements.get('world').height, 800);
  assert.ok(rafQueue.length > 0);
});
