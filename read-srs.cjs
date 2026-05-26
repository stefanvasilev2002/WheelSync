const { PDFParse } = require('./node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve('G:/Other computers/My Laptop/Fax/IX \u0441\u0435\u043c\u0435\u0441\u0442\u0430\u0440/\u0423\u0421\u0416\u0426\u041d\u0421/Software Requirements Specification.pdf');
const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');

async function main() {
  const parser = new PDFParse({ url: fileUrl, verbosity: 0 });
  await parser.load();
  const result = await parser.getText();
  let fullText = '';
  for (const page of result.pages) {
    fullText += `\n=== Страна ${page.num} ===\n${page.text}\n`;
  }
  fs.writeFileSync('C:/Users/stefa/Desktop/WheelSync/srs_text.txt', fullText, 'utf8');
  console.error('Done. Pages:', result.pages.length);
}

main().catch(console.error);
