import { defineConfig } from 'vite';

// Build into ./docs so the GitHub Pages Action can publish it directly.
// base: './' makes all asset URLs relative, so the game works no matter what
// sub-path the repo is published under (e.g. https://user.github.io/repo/).
export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2018',
  },
});
