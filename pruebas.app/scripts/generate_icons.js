const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.slice(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR: width, height, 8 bit, RGBA (color type 6)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + size * 4;
  const rawData = Buffer.alloc(size * rowSize);

  const cx = size / 2;
  const cy = size / 2;
  const circleRadius = size * 0.42;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0: None

    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default: Fondo azul oscuro grafito (#0f172a)
      let r = 15, g = 23, b = 42, a = 255;

      // Círculo central naranja reformas (#ea580c)
      if (dist <= circleRadius) {
        r = 234; g = 88; b = 12; // #ea580c

        // Dibujo de Martillo / Símbolo "IX" blanco central
        // Trazamos una "I" y una "X" centradas o un martillo estilizado
        const scale = size / 192;
        
        // Letra 'I'
        const inI = (x >= cx - 45 * scale && x <= cx - 25 * scale && y >= cy - 40 * scale && y <= cy + 40 * scale);
        // Letra 'X'
        const xRel = (x - (cx + 25 * scale)) / scale;
        const yRel = (y - cy) / scale;
        const inDiag1 = Math.abs(xRel - yRel) < 10 && Math.abs(xRel) <= 35 && Math.abs(yRel) <= 40;
        const inDiag2 = Math.abs(xRel + yRel) < 10 && Math.abs(xRel) <= 35 && Math.abs(yRel) <= 40;

        if (inI || inDiag1 || inDiag2) {
          r = 255; g = 255; b = 255; // Blanco nítido
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const p192 = createPng(192);
const p512 = createPng(512);

fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), p192);
fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), p512);

console.log('Generados icon-192.png y icon-512.png correctamente.');
console.log('192 bytes:', p192.length, 'Header:', p192.slice(0, 8).toString('hex'));
console.log('512 bytes:', p512.length, 'Header:', p512.slice(0, 8).toString('hex'));
