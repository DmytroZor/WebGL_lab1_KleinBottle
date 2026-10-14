# Practical Assignment #1 — Klein Bottle (Variant 6)

This folder contains the files to add/replace in the original `ademch/WebGL` skeleton.

## Apply the patch

1. Download or clone the original skeleton repository: https://github.com/ademch/WebGL
2. Keep the original helper files, especially `Utils/m4.js`, `Utils/trackball-rotator.js`, and `shader.js`.
3. Copy `Model.js` into the repository root.
4. Replace the skeleton's `main.js` and `index.html` with the versions in this folder.
5. Run the page from a local web server (for example, in the repository root: `python -m http.server 8000`) and open `http://localhost:8000`.

## Implementation notes

- The Klein bottle uses the handbook's parametric equations, with `a = 2.5` (the handbook requires `a > 2`).
- `CreateSurfaceData()` builds a two-dimensional grid of points and extracts two families of polylines.
- `Model.js` stores the U and V families separately. Each family is packed into its own WebGL vertex buffer, with draw ranges for every polyline. Each range is issued as a separate `gl.LINE_STRIP` draw call, preventing accidental lines between neighboring curves.
- U-curves have varying `u` and fixed `v`; V-curves have fixed `u` and varying `v`.
- The original skeleton's `m4` matrix library, shader source file, and trackball rotator are reused unchanged.

## Git branch

Create and use the required branch from the root of the skeleton repository:

```bash
git switch -c PA1
```

After testing, commit the changed files and push the branch to your GitHub repository.
