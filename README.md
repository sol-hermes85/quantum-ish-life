# Quantum-ish Life

A small mobile-friendly browser game inspired by Conway's Game of Life, with probability states instead of simple alive/dead cells.

White cells are dead, coloured cells are alive, and paler cells are uncertain. Each generation secretly collapses the probability grid, counts neighbours, then creates the next probability grid.

## Play

Open `index.html` in a browser.

If hosted on GitHub Pages, the game can run as a static site with no build step.

## Controls

- **Play / Pause**: run or stop the simulation
- **Step**: advance one generation
- **Random**: seed a random grid
- **Invert**: flip the current probability grid so empty areas become alive and live areas become empty
- **Clear**: reset the grid
- **One finger drag**: paint or erase cells
- **Two finger pinch / drag**: zoom and pan around the grid
- **Scroll wheel / + − buttons**: zoom in or out on the grid
- **Reset view**: return zoom and pan to the default view; the current zoom level is shown in the stats panel
- **Grid size**: change the simulation resolution
- **Preset pattern**: seed a glider, blinker, lightweight spaceship, R-pentomino, acorn, diehard, toad, pulsar, beacon, clock, or random soup
- **Rule preset**: quickly switch between classic-ish, calm, and chaotic probability rules
- **Random density**: control how full the random grid and random soup preset are
- **Cell age limit**: set how many generations a living cell can survive before ageing out; `0` means cells never die of age
- **Colour hue / saturation**: tune the colour used for live cells
- **Disco mode**: cycle cells through the seven rainbow colours, changing each generation
- **Speed**: generations per second
- **Live count**: shows how many cells currently have at least 50% live probability
- **Fill**: shows that live count as a percentage of the current grid
- **Hide / Show controls**: collapse the tuning panel so the grid stays visible while the simulation runs
- **Underpopulation / survival / overpopulation / birth / noise**: tune the probability rules
- **Keyboard shortcuts**: Space play/pause, `S` step, `R` random, `C` clear, `I` invert, `D` disco mode, `E` paint/erase, `H` hide/show controls, `Z` reset view

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
