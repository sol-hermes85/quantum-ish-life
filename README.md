# Quantum-ish Life

A small mobile-friendly browser game inspired by Conway's Game of Life, with probability states instead of simple alive/dead cells.

White cells are dead, coloured cells are alive, and paler cells are uncertain. Each generation secretly collapses the probability grid, counts neighbours, then creates the next probability grid.

## Play

Open `index.html` in a browser.

If hosted on GitHub Pages, the game can run as a static site with no build step.

## Controls

- **Play / Pause**: run or stop the simulation
- **Step**: advance one generation and show the new generation over the grid
- **Random**: seed a random grid
- **Invert**: flip the current probability grid so empty areas become alive and live areas become empty
- **Clear**: ask for one quick confirmation, then reset the grid so a stray tap does not wipe a good pattern
- **One finger drag**: paint or erase cells; fast drags fill the gaps between cells, stroke feedback reports how many cells changed, desktop mouse users get a crosshair cursor and filled brush preview before painting, erase/pan modes change the cursor, and the active paint/erase button is visually marked
- **Alt-drag**: temporarily flip paint and erase for quick corrections without changing the selected tool; the desktop hover preview also flips so you can see the temporary tool before drawing
- **Two finger pinch / drag**: zoom and pan around the grid, with a brief zoom percentage shown when the pinch ends
- **Double-click / double-tap / `Home` / `0` key**: reset the view quickly from the grid or keyboard
- **Frame button / `F` key**: frame the current live cells, zooming and panning to keep the active area centred; with no live cells it falls back to reset view
- **Shift-drag / middle-drag / right-drag**: pan the grid with a mouse or trackpad without painting
- **Scroll wheel / + − buttons**: zoom in or out on the grid; zoom buttons dim when the view is already at its limit, and touch devices get larger tap targets
- **Reset view**: return zoom and pan to the default view; the current zoom level is shown in the stats panel
- **Grid size**: change the simulation resolution
- **Probability brush**: switch between a precise dot and Bloom, a soft 3 × 3 probability cluster with weaker surrounding cells and matching erase behaviour; press `B` to toggle it quickly while painting
- **Preset pattern**: seed a glider, blinker, traffic light, lightweight spaceship, R-pentomino, small exploder, acorn, diehard, loaf, block, toad, cross, diamond, boat, tub, pulsar, beacon, clock, pentadecathlon, Gosper glider gun, or random soup; choosing a preset replaces the current grid, selected patterns show their live cell count, auto-frame into view, and stay selected when the grid size changes
- **Rule preset**: quickly switch between classic-ish, calm, HighLife-ish, spark, and chaotic probability rules; the active preset is shown with a readable label and each preset moves the survival, birth, and noise sliders together. HighLife-ish uses its defining `B36` births with three or six neighbours
- **Random density**: control how full the random grid and random soup preset are
- **Cell age limit**: set how many generations a living cell can survive before ageing out; `0` means cells never die of age
- **Colour hue / saturation**: tune the colour used for live cells
- **Disco mode**: cycle cells through the seven rainbow colours, changing each generation
- **Time Echo**: leave faint, fading traces of recent cell probabilities so movement, waves, and collapses are easier to follow
- **Speed**: generations per second
- **Tool**: shows whether drag will paint or erase cells and whether the Dot or Bloom brush is active; reselecting the active tool is ignored to avoid noisy duplicate feedback, and play, pause with generation context, random, clear confirmation, invert, pattern load, reset-view, brush changes, painting, erasing, manual stepping, and zoom changes also show a brief feedback pill over the grid, with longer messages staying visible a little longer
- **Running state**: adds a subtle colour wash over the grid so play feels alive without adding visual clutter
- **Avg probability**: shows the average live probability across the grid
- **Live count**: shows how many cells currently have at least 50% live probability
- **Fill**: shows that live count as a percentage of the current grid
- **Trend**: shows whether the live population is rising, falling, or steady between draws, with a subtle colour cue
- **Stats panel**: key changing values announce politely for assistive technology without interrupting play
- **Browser tab title**: shows whether the simulation is running and the current generation
- **Hide / Show controls**: collapse the tuning panel so the grid stays visible while the simulation runs
- **Mobile play view**: starting the simulation on a small screen folds the tuning controls away so the grid stays open
- **Hidden tabs**: the simulation pauses when the browser tab is hidden to avoid wasting battery in the background
- **Primary controls**: sit on a subtle glass tray with brighter hover states so they remain readable over busy patterns
- **Underpopulation / survival / overpopulation / birth / noise**: tune the probability rules
- **Keyboard shortcuts**: Space or `P` play/pause, `Esc` pause, `S` step, `R` random, `C` clear, `I` invert, `D` disco mode, `B` Dot/Bloom brush, `E` paint/erase, `1` paint, `2` erase, `H` hide/show controls, `F` frame live cells, `Z`, `Home`, or `0` reset view, `+` / `-` zoom. Held shortcuts are ignored after the first keydown so one long press does not flood steps or resets

## Local development

This is a small static HTML/CSS/JavaScript project.

Run a local web server if you want browser-like hosting behaviour:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

This is intentionally lightweight and dependency-free. No framework, no build chain, no npm ceremony.

The interface also respects reduced-motion preferences, keeps the floating zoom controls inside safe-area insets, gives range sliders a larger grab area and coarse-pointer buttons larger tap targets, and keeps the logical grid square and centred on non-square screens. Collapsed controls keep the stats tray tighter and quieter over the grid. It caps very high display pixel ratios, reuses the existing pixel buffer for camera and overlay-only redraws, primes canvas alpha once per buffer, skips unchanged stat/control-label, title, and disabled-button writes, avoids redundant reset-view and clamped pinch redraws, avoids repeated draw-size calculations for grid overlays, avoids temporary arrays while handling pinch gestures, reuses paint stroke tracking collections between strokes, keeps the fine guide grid subtle as cells get larger, draws a faint grid boundary so panned and zoomed edges remain legible, skips brush-mode canvas redraws when no hover preview is visible, avoids redraws for hidden colour changes while disco mode owns the palette, avoids a per-cell index helper call during simulation steps, catches up a few missed simulation ticks after a slow frame without spiralling, and resets the simulation clock on resume so play starts smoothly after a pause.
