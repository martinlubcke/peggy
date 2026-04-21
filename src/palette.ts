export type RGB = [number, number, number];

export interface PaletteColor {
  id: string;
  name: string;
  rgb: RGB;
  enabled?: boolean;
}

// En standard Hama Midi palett (ett urval av vanliga färger)
export const HAMA_STANDARD_PALETTE: PaletteColor[] = [
  { id: '01', name: 'White', rgb: [240, 240, 240], enabled: true },
  { id: '18', name: 'Black', rgb: [20, 20, 20], enabled: true },
  { id: '05', name: 'Red', rgb: [200, 30, 40], enabled: true },
  { id: '10', name: 'Green', rgb: [30, 150, 60], enabled: true },
  { id: '08', name: 'Blue', rgb: [20, 60, 180], enabled: true },
  { id: '03', name: 'Yellow', rgb: [240, 200, 20], enabled: true },
  { id: '04', name: 'Orange', rgb: [220, 110, 20], enabled: true },
  { id: '06', name: 'Pink', rgb: [230, 120, 150], enabled: true },
  { id: '07', name: 'Purple', rgb: [120, 60, 140], enabled: true },
  { id: '12', name: 'Brown', rgb: [90, 50, 30], enabled: true },
  { id: '17', name: 'Grey', rgb: [130, 130, 130], enabled: true },
  { id: '22', name: 'Dark Red', rgb: [140, 20, 30], enabled: true },
  { id: '09', name: 'Light Blue', rgb: [100, 160, 220], enabled: true },
  { id: '11', name: 'Light Green', rgb: [130, 200, 120], enabled: true },
];

let currentPalette: PaletteColor[] = [...HAMA_STANDARD_PALETTE];

export function setCurrentPalette(palette: PaletteColor[]) {
  currentPalette = palette;
}

export function getCurrentPalette(): PaletteColor[] {
  return currentPalette;
}

// Hittar närmaste färg med Euklidiskt avstånd
export function findNearestColor(r: number, g: number, b: number, palette: PaletteColor[]): PaletteColor {
  const activePalette = palette.filter(c => c.enabled !== false);
  if (activePalette.length === 0) return palette[0]; // Fallback om alla är avstängda

  let minDistance = Infinity;
  let nearestColor = activePalette[0];

  for (const color of activePalette) {
    const [pr, pg, pb] = color.rgb;
    // Viktat euklidiskt avstånd för att mänskliga ögat är känsligare för grönt
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const distance = (dr * dr * 0.3) + (dg * dg * 0.59) + (db * db * 0.11);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = color;
    }
  }

  return nearestColor;
}

// Enkel K-means-liknande algoritm / dominant färg extraktion
export function extractPaletteFromImage(imgData: ImageData, colorCount: number = 15): PaletteColor[] {
  const pixels = imgData.data;
  const pixelCount = pixels.length / 4;
  
  // Minska upplösningen för snabbare analys genom att ta var 10:e pixel
  const step = 10;
  const samples: RGB[] = [];
  
  for (let i = 0; i < pixelCount; i += step) {
    const idx = i * 4;
    // Ignorera transparenta eller nästan transparenta pixlar
    if (pixels[idx + 3] < 128) continue;
    samples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
  }

  // Om bilden är väldigt tom
  if (samples.length === 0) return HAMA_STANDARD_PALETTE;

  // Låt oss göra en väldigt förenklad "Median Cut" eller bara plocka slumpmässiga startpunkter och optimera (enkel K-means)
  // Initiera med slumpmässiga färgprover
  let centroids: RGB[] = [];
  for (let i = 0; i < colorCount; i++) {
    centroids.push(samples[Math.floor(Math.random() * samples.length)]);
  }

  // K-means iterationer (kör ca 10 iterationer för snabbhet)
  for (let iter = 0; iter < 10; iter++) {
    const clusters: RGB[][] = Array.from({ length: colorCount }, () => []);
    
    // Tilldela prover till närmaste centroid
    for (const sample of samples) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < colorCount; c++) {
        const dist = distSq(sample, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = c;
        }
      }
      clusters[minIdx].push(sample);
    }

    // Uppdatera centroider
    for (let c = 0; c < colorCount; c++) {
      if (clusters[c].length === 0) continue;
      let sumR = 0, sumG = 0, sumB = 0;
      for (const p of clusters[c]) {
        sumR += p[0];
        sumG += p[1];
        sumB += p[2];
      }
      centroids[c] = [
        Math.round(sumR / clusters[c].length),
        Math.round(sumG / clusters[c].length),
        Math.round(sumB / clusters[c].length)
      ];
    }
  }

  // Rensa ut tomma/duplikat centroider
  const uniquePalettes: PaletteColor[] = [];
  centroids.forEach((c, i) => {
    // Undvik uppenbara dubbletter (väldigt nära varandra)
    const isDuplicate = uniquePalettes.some(up => distSq(up.rgb, c) < 400); // Tröskelvärde
    if (!isDuplicate && !isNaN(c[0])) {
      uniquePalettes.push({
        id: `Custom-${i}`,
        name: `Egen färg`,
        rgb: c,
        enabled: true
      });
    }
  });

  return uniquePalettes.length > 0 ? uniquePalettes : HAMA_STANDARD_PALETTE;
}

function distSq(c1: RGB, c2: RGB) {
  return (c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2;
}
