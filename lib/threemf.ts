import { createZip } from "./zip";

export interface ColoredTriangleMesh {
  /** "Trojuholníková polievka" - 3 vrcholy na trojuholník, bez zdieľania. */
  positions: Float32Array;
  /** Farba každého trojuholníka v tvare "#RRGGBB", v rovnakom poradí ako positions. */
  triangleColorsHex: string[];
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function vertexKey(x: number, y: number, z: number, precision = 4): string {
  return `${x.toFixed(precision)},${y.toFixed(precision)},${z.toFixed(precision)}`;
}

/**
 * Vytvori .3mf subor podla oficialnej 3MF specifikacie (Materials and
 * Properties Extension - <m:colorgroup>), ktoru Bambu Studio od verzie
 * 1.8.4 vie nacitat cez svoj "Standard 3MF Color Parsing" dialog a
 * automaticky priradit farebne skupiny na AMS sloty. Toto NIE JE
 * reverzne inzinierovany sukromny format Bambu Studio - je to oficialny,
 * zdokumentovany format 3MF konzorcia.
 */
export function buildColoredThreeMF(mesh: ColoredTriangleMesh): Blob {
  const { positions, triangleColorsHex } = mesh;
  const triangleCount = triangleColorsHex.length;

  // Zoznam unikatnych farieb pouzitych v modeli - kazda dostane index do
  // <m:colorgroup>. Poradie je dolezite (Bambu Studio mapuje skupiny na
  // AMS sloty podla poradia, nie podla hex hodnoty).
  const uniqueColors: string[] = [];
  const colorIndexByHex = new Map<string, number>();
  for (const hex of triangleColorsHex) {
    if (!colorIndexByHex.has(hex)) {
      colorIndexByHex.set(hex, uniqueColors.length);
      uniqueColors.push(hex);
    }
  }

  // "Zlepenie" zhodnych vrcholov - vstupne data su "trojuholnikova polievka"
  // (kazdy trojuholnik ma svoje vlastne 3 body, aj ked su na tom istom
  // mieste ako body suseda). Na rozdiel od .stl formatu, ktory Bambu
  // Studio pri nacitani automaticky "zlepi" sama, .3mf format ocakava, ze
  // zdielane hrany uz odkazuju na ten isty index vrcholu - inak sa kazda
  // hrana javi ako "otvorena" (chyba "N open edges").
  const vertexIndexByKey = new Map<string, number>();
  const weldedVertices: string[] = [];
  const triangleLines: string[] = [];

  function weldVertex(x: number, y: number, z: number): number {
    const key = vertexKey(x, y, z);
    const existing = vertexIndexByKey.get(key);
    if (existing !== undefined) return existing;
    const index = weldedVertices.length;
    weldedVertices.push(`<vertex x="${x}" y="${y}" z="${z}"/>`);
    vertexIndexByKey.set(key, index);
    return index;
  }

  for (let t = 0; t < triangleCount; t++) {
    const base = t * 9; // 3 vrcholy * 3 suradnice
    const indices: number[] = [];
    for (let i = 0; i < 3; i++) {
      const x = positions[base + i * 3];
      const y = positions[base + i * 3 + 1];
      const z = positions[base + i * 3 + 2];
      indices.push(weldVertex(x, y, z));
    }
    const colorIndex = colorIndexByHex.get(triangleColorsHex[t]) ?? 0;
    triangleLines.push(
      `<triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}" pid="1" p1="${colorIndex}"/>`
    );
  }

  const colorGroupLines = uniqueColors
    .map((hex) => `<m:color color="${escapeXml(hex)}"/>`)
    .join("");

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <m:colorgroup id="1">${colorGroupLines}</m:colorgroup>
    <object id="2" type="model">
      <mesh>
        <vertices>${weldedVertices.join("")}</vertices>
        <triangles>${triangleLines.join("")}</triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="2"/>
  </build>
</model>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  const encoder = new TextEncoder();
  return createZip([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml) },
    { name: "_rels/.rels", data: encoder.encode(relsXml) },
    { name: "3D/3dmodel.model", data: encoder.encode(modelXml) },
  ]);
}
