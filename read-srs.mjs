import { PDFParse } from './node_modules/pdf-parse/dist/pdf-parse/esm/index.js';
import { readFileSync } from 'fs';

const buf = readFileSync('G:/Other computers/My Laptop/Fax/IX семестар/УСЖЦНС/Software Requirements Specification.pdf');
const parser = new PDFParse({ verbosity: 0 });
const data = await parser.parse(buf);
process.stdout.write(data.text);
