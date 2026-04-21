import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Detta gör att statiska filer kan laddas korrekt på GitHub Pages oavsett mappstruktur
  build: {
    outDir: 'docs', // Lägger ut-filerna i /docs istället för /dist, vilket gör det enkelt att aktivera GitHub Pages
    emptyOutDir: true, // Rensar docs-mappen vid varje nytt bygge
  },
  server: {
    host: '0.0.0.0', // Viktigt för att Docker/Podman ska kunna exponera porten
    port: 5173,
    watch: {
      usePolling: true, // Ofta nödvändigt när man kör inuti Docker/Podman för att filändringar ska snappas upp
    }
  }
});
