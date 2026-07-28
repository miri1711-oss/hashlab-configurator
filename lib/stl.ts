import * as THREE from "three";
import { ModelDimensions } from "./types";

/**
 * Vypočíta reálne rozmery (bounding box) a objem modelu z geometrie
 * parsovanej z nahraného STL súboru. Predpokladá, že súradnice v STL
 * súbore sú v milimetroch (bežný štandard pri 3D tlači).
 *
 * Objem sa počíta súčtom znamienkových objemov štvorstenov (tetrahedra)
 * tvorených každým trojuholníkom siete a počiatkom - štandardná metóda
 * na výpočet objemu uzavretého trojuholníkového meshu (divergence theorem).
 */
export function computeDimensionsFromGeometry(geometry: THREE.BufferGeometry): ModelDimensions {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  if (box) box.getSize(size);

  const position = geometry.getAttribute("position");
  let volumeMm3 = 0;

  if (position) {
    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 3) {
      pA.fromBufferAttribute(position, i);
      pB.fromBufferAttribute(position, i + 1);
      pC.fromBufferAttribute(position, i + 2);
      volumeMm3 += signedTetrahedronVolume(pA, pB, pC);
    }
  }

  return {
    x: Number(size.x.toFixed(1)),
    y: Number(size.y.toFixed(1)),
    z: Number(size.z.toFixed(1)),
    volumeCm3: Math.abs(volumeMm3) / 1000,
  };
}

function signedTetrahedronVolume(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  return p1.dot(p2.clone().cross(p3)) / 6;
}
