(() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);

  const controls = {
    play: $('play'),
    step: $('step'),
    randomise: $('randomise'),
    clear: $('clear'),
    paintMode: $('paintMode'),
    eraseMode: $('eraseMode'),
    gridSize: $('gridSize'),
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
    gridSize: $('gridSizeValue'),
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
  let generation = 0;
  let running = false;
  let lastTick = 0;
  let isDrawing = false;
  let tool = 'paint';
  let drawQueued = false;

  const bufferCanvas = document.createElement('canvas');
  const bufferCtx = bufferCanvas.getContext('2d', { alpha: false });
  let image = null;

  function resizeBuffers(newSize) {
    size = newSize;
    grid = new Float32Array(size * size);
    next = new Float32Array(size * size);
    collapsed = new Uint8Array(size * size);
    bufferCanvas.width = size;
    bufferCanvas.height = size;
    image = bufferCtx.createImageData(size, size);
  }

  function idx(x, y) {
    return y * size + x;
  }

  function clamp(v) {
    return Math.max(0, Math.min(1, v));
  }

  function seedVisiblePattern() {
    grid.fill(0);
    const mid = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - mid;
        const dy = y - mid;
        const d = Math.sqrt(dx * dx + dy * dy);
        const i = idx(x, y);

        if (d < size * 0.18) grid[i] = 0.85;
        else if (d < size * 0.28) grid[i] = 0.45;
        else if (Math.random() < 0.04) grid[i] = Math.random() * 0.8;
      }
    }

    generation = 0;
    requestDraw();
  }

  function randomise() {
    grid.fill(0);

    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < 0.28 ? Math.random() : 0;
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

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = idx(x, y);
        const alive = collapsed[i] === 1;
        const n = neighbours(x, y);
        let p = noise * Math.random();

        if (alive && n < 2) p = under;
        else if (alive && (n === 2 || n === 3)) p = survive;
        else if (alive && n > 3) p = over;
        else if (!alive && n === 3) p = birth;

        next[i] = clamp(p);
      }
    }

    [grid, next] = [next, grid];
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

    for (let i = 0; i < grid.length; i++) {
      const p = grid[i];
      const shade = Math.round(255 * (1 - p));
      const o = i * 4;

      total += p;
      pixels[o] = shade;
      pixels[o + 1] = shade;
      pixels[o + 2] = shade;
      pixels[o + 3] = 255;
    }

    bufferCtx.putImageData(image, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bufferCanvas, 0, 0, canvas.width, canvas.height);
    drawGuideGrid();

    labels.generation.textContent = generation;
    labels.average.textContent = (total / grid.length).toFixed(3);
    updateLabels();
  }

  function drawGuideGrid() {
    const cell = canvas.width / size;

    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= size; i++) {
      const pos = Math.round(i * cell) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  }

  function updateLabels() {
    labels.gridSize.textContent = `${size} × ${size}`;
    labels.speed.textContent = `${controls.speed.value} gen/s`;

    for (const key of ['under', 'survive', 'over', 'birth', 'noise']) {
      labels[key].textContent = Number(controls[key].value).toFixed(2);
    }
  }

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - r.left) / r.width) * size),
      y: Math.floor(((e.clientY - r.top) / r.height) * size)
    };
  }

  function paint(e) {
    const p = canvasPoint(e);
    if (p.x < 0 || p.x >= size || p.y < 0 || p.y >= size) return;

    grid[idx(p.x, p.y)] = tool === 'erase' ? 0 : 1;
    requestDraw();
  }

  function setTool(t) {
    tool = t;
    controls.paintMode.classList.toggle('primary', t === 'paint');
    controls.eraseMode.classList.toggle('primary', t === 'erase');
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

  controls.play.addEventListener('click', () => {
    running = !running;
    controls.play.textContent = running ? 'Pause' : 'Play';
    controls.play.classList.toggle('primary', !running);
  });

  controls.step.addEventListener('click', step);
  controls.randomise.addEventListener('click', randomise);
  controls.clear.addEventListener('click', () => {
    grid.fill(0);
    generation = 0;
    requestDraw();
  });
  controls.paintMode.addEventListener('click', () => setTool('paint'));
  controls.eraseMode.addEventListener('click', () => setTool('erase'));
  controls.gridSize.addEventListener('input', () => {
    resizeBuffers(Number(controls.gridSize.value));
    seedVisiblePattern();
  });

  for (const key of ['speed', 'under', 'survive', 'over', 'birth', 'noise']) {
    controls[key].addEventListener('input', () => {
      updateLabels();
      requestDraw();
    });
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    isDrawing = true;
    canvas.setPointerCapture?.(e.pointerId);
    paint(e);
  }, { passive: false });

  canvas.addEventListener('pointermove', e => {
    if (!isDrawing) return;
    e.preventDefault();
    paint(e);
  }, { passive: false });

  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    isDrawing = false;
    canvas.releasePointerCapture?.(e.pointerId);
  }, { passive: false });

  canvas.addEventListener('pointercancel', () => {
    isDrawing = false;
  });

  window.addEventListener('resize', requestDraw);

  resizeBuffers(size);
  seedVisiblePattern();
  requestAnimationFrame(loop);
})();
