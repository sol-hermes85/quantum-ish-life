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

test('cells older than the configured limit are forced to die', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testAge = shouldCellAgeOut;`, sandbox);

  assert.strictEqual(sandbox.window.__testAge(6, 5), true);
  assert.strictEqual(sandbox.window.__testAge(5, 5), false);
  assert.strictEqual(sandbox.window.__testAge(100, 0), false);
});

test('browser zoom state is constrained to a useful range', () => {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(`${js}\nwindow.__testZoom = nextZoomLevel; window.__testPinch = nextPinchZoomLevel;`, sandbox);

  assert.strictEqual(sandbox.window.__testZoom(1, -100), 1.1);
  assert.strictEqual(sandbox.window.__testZoom(1, 100), 0.9);
  assert.strictEqual(sandbox.window.__testZoom(4, -100), 4);
  assert.strictEqual(sandbox.window.__testZoom(0.25, 100), 0.25);
  assert.strictEqual(sandbox.window.__testPinch(1, 100, 150), 1.5);
  assert.strictEqual(sandbox.window.__testPinch(1.5, 150, 100), 1);
  assert.strictEqual(sandbox.window.__testPinch(4, 100, 150), 4);
});

test('mobile zoom controls exist beside the grid', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(html, /id="zoomIn"/);
  assert.match(html, /id="zoomOut"/);
  assert.match(js, /applyZoomDelta/);
  assert.match(js, /nextPinchZoomLevel/);
  assert.match(css, /\.zoomControls\s*{/);
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
      value: ({ gridSize: '50', ageLimit: '5', speed: '8', under: '0.10', survive: '0.90', over: '0.75', birth: '0.75', noise: '0.02' })[id] || '',
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
