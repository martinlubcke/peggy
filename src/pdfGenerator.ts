import { jsPDF } from 'jspdf';
import { PaletteColor } from './palette';

export function generatePDF(patternMatrix: PaletteColor[][]) {
  // A4-format, stående (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = patternMatrix[0].length;
  const height = patternMatrix.length;

  // En standard pärlplatta är 145mm x 145mm, med 29x29 pärlor. 
  // Varje ruta blir därmed 5mm bred (145/29 = 5).
  const cellSize = 5; 
  const totalSize = width * cellSize; // 145mm

  // Centrera horisontellt, lägg en marginal högst upp
  const startX = (210 - totalSize) / 2;
  const startY = 30;

  doc.setFontSize(16);
  doc.text("Pärlplattemönster - Peggy", 105, 20, { align: 'center' });

  doc.setLineWidth(0.1);
  doc.setDrawColor(200, 200, 200); // Ljusgrått för nätet

  const counts: Record<string, { color: PaletteColor, count: number }> = {};

  // Rita ut rutnätet
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = patternMatrix[y][x];
      if (!color) continue;

      // Spåra antal per färg för inköpslista
      if (!counts[color.id]) counts[color.id] = { color, count: 0 };
      counts[color.id].count++;

      doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
      // Rita en liten cirkel (pärla) istället för en solid fyrkant för att likna riktiga pärlor
      // Valfritt: Fyll ruta som bakgrund och cirkel inuti
      doc.rect(startX + (x * cellSize), startY + (y * cellSize), cellSize, cellSize, 'FD');
    }
  }

  // Sida 2: Inköpslista
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Sammanställning (Färger och antal)", 20, 20);

  doc.setFontSize(12);
  let listY = 35;
  const colorsList = Object.values(counts).sort((a, b) => b.count - a.count);

  for (const item of colorsList) {
    // Rita liten färgindikator
    doc.setFillColor(item.color.rgb[0], item.color.rgb[1], item.color.rgb[2]);
    doc.rect(20, listY - 4, 6, 6, 'FD');

    // Skriv ut namn och antal
    doc.text(`${item.color.name} (ID: ${item.color.id}): ${item.count} st`, 30, listY);
    
    listY += 8;
    // Byt sida om listan blir för lång
    if (listY > 280) {
      doc.addPage();
      listY = 20;
    }
  }

  // Ladda ner filen
  doc.save('peggy-parlplatta.pdf');
}
