import { PaletteColor, findNearestColor } from './palette';

export interface ImageAdjustments {
  r: number;
  g: number;
  b: number;
  contrast: number; // -100 to 100
  brightness: number; // -255 to 255
  blackPoint: number; // 0 to 255
  whitePoint: number; // 0 to 255
  saturation: number; // 0.0 to 5.0 (1.0 = original)
  dither: number; // 0.0 to 1.0
}

export function processImageToPattern(
  sourceCanvas: HTMLCanvasElement, 
  targetCanvas: HTMLCanvasElement, 
  palette: PaletteColor[], 
  adj: ImageAdjustments
): PaletteColor[][] {
  const ctxTarget = targetCanvas.getContext('2d');
  const ctxSource = sourceCanvas.getContext('2d');
  
  if (!ctxTarget || !ctxSource) return [];

  // Pärlplattan är 29x29
  const width = 29;
  const height = 29;

  // Läs in pixeldata från originalbilden (redan nedskalad till 29x29 på sourceCanvas)
  const sourceImgData = ctxSource.getImageData(0, 0, width, height);
  const data = sourceImgData.data;

  // Applicera grundläggande färgjusteringar (Kontrast, Gamma, RGB kanaler)
  const factor = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // RGB kanal-multiplikator
    r = Math.min(255, r * adj.r);
    g = Math.min(255, g * adj.g);
    b = Math.min(255, b * adj.b);

    // Kontrast
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    // Ljusstyrka
    r += adj.brightness;
    g += adj.brightness;
    b += adj.brightness;

    // Levels (Svartpunkt & Vitpunkt)
    const bp = adj.blackPoint;
    const wp = adj.whitePoint;
    const range = Math.max(1, wp - bp); // Undvik division med 0

    r = 255 * (r - bp) / range;
    g = 255 * (g - bp) / range;
    b = 255 * (b - bp) / range;

    // Färgmättnad
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    r = L + (r - L) * adj.saturation;
    g = L + (g - L) * adj.saturation;
    b = L + (b - L) * adj.saturation;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Floyd-Steinberg Dithering och Färgmappning
  const patternMatrix: PaletteColor[][] = Array(height).fill(null).map(() => Array(width).fill(null));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldR = data[idx];
      const oldG = data[idx + 1];
      const oldB = data[idx + 2];

      // Hitta närmaste färg
      const nearest = findNearestColor(oldR, oldG, oldB, palette);
      patternMatrix[y][x] = nearest;

      const newR = nearest.rgb[0];
      const newG = nearest.rgb[1];
      const newB = nearest.rgb[2];

      // Rita ut pixeln på target canvas (som ritas i 290x290 storlek via css, så 10x10 pixlar per pärla)
      ctxTarget.fillStyle = `rgb(${newR},${newG},${newB})`;
      ctxTarget.fillRect(x * 10, y * 10, 10, 10);
      
      // Rita en subtil grid-linje/cirkel för pärlkänsla
      ctxTarget.strokeStyle = "rgba(0,0,0,0.3)";
      ctxTarget.lineWidth = 1;
      ctxTarget.strokeRect(x * 10, y * 10, 10, 10);

      // Kalkylera dithering fel
      if (adj.dither > 0) {
        const errR = (oldR - newR) * adj.dither;
        const errG = (oldG - newG) * adj.dither;
        const errB = (oldB - newB) * adj.dither;

        const distributeError = (xOffset: number, yOffset: number, weight: number) => {
          const nx = x + xOffset;
          const ny = y + yOffset;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = (ny * width + nx) * 4;
            data[nidx] += errR * weight;
            data[nidx + 1] += errG * weight;
            data[nidx + 2] += errB * weight;
          }
        };

        // Standard Floyd-Steinberg vikter
        distributeError(1, 0, 7 / 16);
        distributeError(-1, 1, 3 / 16);
        distributeError(0, 1, 5 / 16);
        distributeError(1, 1, 1 / 16);
      }
    }
  }

  return patternMatrix;
}
