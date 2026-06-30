# Quantum-ish Life

A small mobile-friendly browser game inspired by Conway's Game of Life, with probability states instead of simple alive/dead cells.

White cells are dead, black cells are alive, and grey cells are uncertain. Each generation secretly collapses the probability grid, counts neighbours, then creates the next probability grid.

## Play

Open `index.html` in a browser.

If hosted on GitHub Pages, the game can run as a static site with no build step.

## Controls

- **Play / Pause**: run or stop the simulation
- **Step**: advance one generation
- **Random**: seed a random grid
- **Clear**: reset the grid
- **Paint / Erase**: draw cells by dragging on the grid
- **Grid size**: change the simulation resolution
- **Speed**: generations per second
- **Underpopulation / survival / overpopulation / birth / noise**: tune the probability rules

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
