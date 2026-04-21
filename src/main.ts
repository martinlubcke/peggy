import './style.css';
import Cropper from 'cropperjs';
import { 
  HAMA_STANDARD_PALETTE, 
  extractPaletteFromImage, 
  setCurrentPalette, 
  getCurrentPalette,
  PaletteColor
} from './palette';
import { processImageToPattern, ImageAdjustments } from './imageProcessor';
import { generatePDF } from './pdfGenerator';

// Element Referenser
const uploadBucket = document.getElementById('upload-bucket') as HTMLInputElement;
const btnStandardPalette = document.getElementById('btn-standard-palette') as HTMLButtonElement;
const currentPaletteDisplay = document.getElementById('current-palette-display') as HTMLDivElement;
const btnAddColor = document.getElementById('btn-add-color') as HTMLButtonElement;
const colorPickerInput = document.getElementById('color-picker-input') as HTMLInputElement;

const uploadImage = document.getElementById('upload-image') as HTMLInputElement;
const editorSection = document.getElementById('editor-section') as HTMLElement;
const imageToCrop = document.getElementById('image-to-crop') as HTMLImageElement;

// Reglage
const sliderR = document.getElementById('slider-r') as HTMLInputElement;
const sliderG = document.getElementById('slider-g') as HTMLInputElement;
const sliderB = document.getElementById('slider-b') as HTMLInputElement;
const sliderContrast = document.getElementById('slider-contrast') as HTMLInputElement;
const sliderBrightness = document.getElementById('slider-brightness') as HTMLInputElement;
const sliderBp = document.getElementById('slider-bp') as HTMLInputElement;
const sliderWp = document.getElementById('slider-wp') as HTMLInputElement;
const sliderSaturation = document.getElementById('slider-saturation') as HTMLInputElement;
const sliderDither = document.getElementById('slider-dither') as HTMLInputElement;

const canvasResult = document.getElementById('canvas-result') as HTMLCanvasElement;
const btnDownloadPdf = document.getElementById('btn-download-pdf') as HTMLButtonElement;

let cropper: Cropper | null = null;
let currentPatternMatrix: PaletteColor[][] = [];

// En dold canvas för att nedskala bilden
const hiddenCanvas = document.createElement('canvas');
hiddenCanvas.width = 29;
hiddenCanvas.height = 29;

function updatePaletteDisplay(palette: PaletteColor[]) {
  currentPaletteDisplay.innerHTML = '';
  palette.forEach((c, index) => {
    const div = document.createElement('div');
    div.className = 'palette-color';
    if (c.enabled === false) div.classList.add('disabled');
    div.style.backgroundColor = `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`;
    div.title = c.name;
    
    div.addEventListener('click', () => {
      c.enabled = c.enabled === false ? true : false;
      updatePaletteDisplay(palette);
      generatePattern();
    });

    currentPaletteDisplay.appendChild(div);
  });
}

// 1. Palett från pärlhink eller standard
btnStandardPalette.addEventListener('click', () => {
  // Deep copy för att inte ändra originalet
  const newPalette = HAMA_STANDARD_PALETTE.map(c => ({...c}));
  setCurrentPalette(newPalette);
  updatePaletteDisplay(newPalette);
  generatePattern();
});

btnAddColor.addEventListener('click', () => {
  colorPickerInput.click();
});

colorPickerInput.addEventListener('change', (e) => {
  const hex = (e.target as HTMLInputElement).value;
  // Konvertera hex till rgb
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  
  const current = getCurrentPalette();
  current.push({
    id: `Custom-Manual-${Date.now()}`,
    name: `Egen Färg`,
    rgb: [r, g, b],
    enabled: true
  });
  
  updatePaletteDisplay(current);
  generatePattern();
});

uploadBucket.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const palette = extractPaletteFromImage(imgData, 15);
      setCurrentPalette(palette);
      updatePaletteDisplay(palette);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
});

// Initiera med standard
updatePaletteDisplay(getCurrentPalette());

// 2. Ladda upp motiv och starta Cropper
uploadImage.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    imageToCrop.src = event.target?.result as string;
    editorSection.classList.remove('hidden');

    if (cropper) {
      cropper.destroy();
    }

    cropper = new Cropper(imageToCrop, {
      aspectRatio: 1, // Kvadratisk eftersom plattan är 29x29
      viewMode: 1,
      cropend: () => {
        // Uppdatera live när man släpper beskärningen
        generatePattern();
      }
    });

    // Vänta lite på att croppern ska ladda
    setTimeout(generatePattern, 500);
  };
  reader.readAsDataURL(file);
});

// 3. Generera Mönster
function generatePattern() {
  if (!cropper) return;

  // Hämta beskuren bild från Cropper
  const croppedCanvas = cropper.getCroppedCanvas({
    width: 29,
    height: 29,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  });

  if (!croppedCanvas) return;

  // Rita ut den till vår dolda canvas
  const hiddenCtx = hiddenCanvas.getContext('2d')!;
  hiddenCtx.clearRect(0, 0, 29, 29);
  hiddenCtx.drawImage(croppedCanvas, 0, 0, 29, 29);

  // Samla in justeringar
  const adj: ImageAdjustments = {
    r: parseFloat(sliderR.value),
    g: parseFloat(sliderG.value),
    b: parseFloat(sliderB.value),
    contrast: parseFloat(sliderContrast.value),
    brightness: parseFloat(sliderBrightness.value),
    blackPoint: parseFloat(sliderBp.value),
    whitePoint: parseFloat(sliderWp.value),
    saturation: parseFloat(sliderSaturation.value),
    dither: parseFloat(sliderDither.value)
  };

  // Behandla bilden och få ut matrisen
  currentPatternMatrix = processImageToPattern(hiddenCanvas, canvasResult, getCurrentPalette(), adj);
}

// Visa live-värden på reglage
const sliderValueDisplays: Record<string, (v: number) => string> = {
  'slider-r':        v => `${Math.round(v * 100)}%`,
  'slider-g':        v => `${Math.round(v * 100)}%`,
  'slider-b':        v => `${Math.round(v * 100)}%`,
  'slider-contrast': v => `${Math.round(v)}`,
  'slider-brightness': v => `${Math.round(v)}`,
  'slider-bp':       v => `${Math.round(v)}`,
  'slider-wp':       v => `${Math.round(v)}`,
  'slider-saturation': v => `${Math.round(v * 100)}%`,
  'slider-dither':   v => `${Math.round(v * 100)}%`,
};

function updateSliderDisplay(slider: HTMLInputElement) {
  const valEl = document.getElementById('val-' + slider.id.replace('slider-', ''));
  if (valEl) valEl.textContent = sliderValueDisplays[slider.id](parseFloat(slider.value));
}

// Lyssna på reglage för live-uppdatering
[sliderR, sliderG, sliderB, sliderContrast, sliderBrightness, sliderBp, sliderWp, sliderSaturation, sliderDither].forEach(slider => {
  slider.addEventListener('input', () => {
    updateSliderDisplay(slider);
    generatePattern();
  });
});


// 4. Ladda ner PDF
btnDownloadPdf.addEventListener('click', () => {
  if (currentPatternMatrix.length > 0) {
    generatePDF(currentPatternMatrix);
  } else {
    alert("Vänligen generera ett mönster först!");
  }
});
