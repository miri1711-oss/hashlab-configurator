import * as THREE from "three";

export interface TriangleMeshData {
  triangleCount: number;
  positions: Float32Array;
  normals: Float32Array;
  adjacency: number[][];
}

function vertexKey(x: number, y: number, z: number, precision = 3): string {
  return `${x.toFixed(precision)},${y.toFixed(precision)},${z.toFixed(precision)}`;
}

/**
 * Predspočíta susednosť trojuholníkov (podľa zdieľaných hrán, keďže STL
 * súbor je "trojuholníkový polievka" bez indexovaných vrcholov) a normálu
 * každého trojuholníka. Toto sa počíta raz pri nahratí modelu a používa sa
 * potom pri každom kliknutí na "inteligentný" výber plochy.
 */
export function buildTriangleMeshData(geometry: THREE.BufferGeometry): TriangleMeshData {
  const positionAttr = geometry.getAttribute("position");
  const positions = new Float32Array(positionAttr.array as ArrayLike<number>);
  const triangleCount = positionAttr.count / 3;

  const normals = new Float32Array(triangleCount * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (let t = 0; t < triangleCount; t++) {
    const i0 = t * 9;
    a.set(positions[i0], positions[i0 + 1], positions[i0 + 2]);
    b.set(positions[i0 + 3], positions[i0 + 4], positions[i0 + 5]);
    c.set(positions[i0 + 6], positions[i0 + 7], positions[i0 + 8]);
    cb.subVectors(c, b);
    ab.subVectors(a, b);
    cb.cross(ab).normalize();
    normals[t * 3] = cb.x;
    normals[t * 3 + 1] = cb.y;
    normals[t * 3 + 2] = cb.z;
  }

  const vertexKeys = new Array<string>(triangleCount * 3);
  for (let t = 0; t < triangleCount; t++) {
    for (let v = 0; v < 3; v++) {
      const idx = t * 9 + v * 3;
      vertexKeys[t * 3 + v] = vertexKey(positions[idx], positions[idx + 1], positions[idx + 2]);
    }
  }

  const edgeMap = new Map<string, number[]>();
  function addEdge(triIndex: number, keyA: string, keyB: string) {
    const edgeKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
    const list = edgeMap.get(edgeKey);
    if (list) list.push(triIndex);
    else edgeMap.set(edgeKey, [triIndex]);
  }

  for (let t = 0; t < triangleCount; t++) {
    const k0 = vertexKeys[t * 3];
    const k1 = vertexKeys[t * 3 + 1];
    const k2 = vertexKeys[t * 3 + 2];
    addEdge(t, k0, k1);
    addEdge(t, k1, k2);
    addEdge(t, k2, k0);
  }

  const adjacency: number[][] = Array.from({ length: triangleCount }, () => []);
  for (const list of edgeMap.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i !== j) adjacency[list[i]].push(list[j]);
      }
    }
  }

  return { triangleCount, positions, normals, adjacency };
}

/**
 * Od trojuholníka, na ktorý sa kliklo, "rozleje" výber na susedné
 * trojuholníky, kým sa nenarazí na ostrú hranu (uhol medzi normálami
 * susedných plôch väčší ako maxAngleDeg). Vďaka tomu klik na plochý QR kód
 * vyberie práve a len jeho plochu, nie celý zvyšok modelu.
 */
export function floodFillRegion(
  mesh: TriangleMeshData,
  startTriangle: number,
  maxAngleDeg = 55
): Set<number> {
  const cosThreshold = Math.cos((maxAngleDeg * Math.PI) / 180);
  const visited = new Set<number>([startTriangle]);
  const stack = [startTriangle];
  const normal = (t: number) =>
    new THREE.Vector3(mesh.normals[t * 3], mesh.normals[t * 3 + 1], mesh.normals[t * 3 + 2]);

  while (stack.length) {
    const current = stack.pop()!;
    const currentNormal = normal(current);
    for (const neighbor of mesh.adjacency[current]) {
      if (visited.has(neighbor)) continue;
      if (currentNormal.dot(normal(neighbor)) >= cosThreshold) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }

  return visited;
}
