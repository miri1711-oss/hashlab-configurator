// Minimalisticky ZIP writer (metoda "STORED" = bez kompresie) - staci na
// vytvorenie platneho .3mf suboru (co je v skutocnosti ZIP archiv) bez
// potreby akejkolvek externej kniznice. Nepouziva kompresiu, takze subory
// su o nieco vacsie, ale format je 100% platny a citatelny.

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(): { date: number; time: number } {
  // Presny cas nie je pre 3MF dolezity, staci platna hodnota.
  return { date: 0x21, time: 0x00 };
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { date, time } = dosDateTime();

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = new DataView(new ArrayBuffer(30));
    localHeader.setUint32(0, 0x04034b50, true);
    localHeader.setUint16(4, 20, true); // verzia potrebna
    localHeader.setUint16(6, 0, true); // flags
    localHeader.setUint16(8, 0, true); // metoda: 0 = STORED (bez kompresie)
    localHeader.setUint16(10, time, true);
    localHeader.setUint16(12, date, true);
    localHeader.setUint32(14, crc, true);
    localHeader.setUint32(18, size, true); // komprimovana velkost = povodna
    localHeader.setUint32(22, size, true);
    localHeader.setUint16(26, nameBytes.length, true);
    localHeader.setUint16(28, 0, true); // extra field

    localParts.push(new Uint8Array(localHeader.buffer), nameBytes, entry.data);

    const centralHeader = new DataView(new ArrayBuffer(46));
    centralHeader.setUint32(0, 0x02014b50, true);
    centralHeader.setUint16(4, 20, true);
    centralHeader.setUint16(6, 20, true);
    centralHeader.setUint16(8, 0, true);
    centralHeader.setUint16(10, 0, true);
    centralHeader.setUint16(12, time, true);
    centralHeader.setUint16(14, date, true);
    centralHeader.setUint32(16, crc, true);
    centralHeader.setUint32(20, size, true);
    centralHeader.setUint32(24, size, true);
    centralHeader.setUint16(28, nameBytes.length, true);
    centralHeader.setUint16(30, 0, true);
    centralHeader.setUint16(32, 0, true);
    centralHeader.setUint16(34, 0, true);
    centralHeader.setUint16(36, 0, true);
    centralHeader.setUint32(38, 0, true);
    centralHeader.setUint32(42, offset, true);

    centralParts.push(new Uint8Array(centralHeader.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralStart, true);
  end.setUint16(20, 0, true);

  const allParts = [...localParts, ...centralParts, new Uint8Array(end.buffer)];
  let totalLength = 0;
  for (const part of allParts) totalLength += part.length;

  const merged = new Uint8Array(totalLength);
  let position = 0;
  for (const part of allParts) {
    merged.set(part, position);
    position += part.length;
  }

  return new Blob([merged.buffer], { type: "application/octet-stream" });
}
