import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildTriangleMeshData, floodFillRegion } from "./paint";

/**
 * Vytvorí testovaciu geometriu s tromi trojuholníkmi:
 * - trojuholník 0 a 1 tvoria spolu rovný štvorec (rovnaká rovina, uhol 0°)
 * - trojuholník 2 je kolmo napojený na trojuholník 0 (zdieľajú hranu,
 *   ale sú na seba kolmé, uhol 90°) - simuluje napr. bočnú stenu QR kódu
 *   napojenú na plochý stojan.
 */
function buildTestGeometry(): THREE.BufferGeometry {
  // prettier-ignore
  const positions = new Float32Array([
    // trojuholník 0 - rovina XY
    0, 0, 0,  1, 0, 0,  1, 1, 0,
    // trojuholník 1 - rovina XY, zdieľa hranu (0,0,0)-(1,1,0) s trojuholníkom 0
    0, 0, 0,  1, 1, 0,  0, 1, 0,
    // trojuholník 2 - kolmá rovina XZ, zdieľa hranu (1,0,0)-(1,1,0) s trojuholníkom 0
    1, 0, 0,  1, 1, 0,  1, 1, 1,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

describe("buildTriangleMeshData", () => {
  it("správne rozpozná susedné trojuholníky podľa zdieľaných hrán", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    expect(mesh.triangleCount).toBe(3);
    // trojuholník 0 susedí s 1 (spoločná hrana) aj s 2 (spoločná hrana)
    expect(mesh.adjacency[0]).toContain(1);
    expect(mesh.adjacency[0]).toContain(2);
  });
});

describe("floodFillRegion", () => {
  it("zahrnie susedný trojuholník v rovnakej rovine (uhol 0°)", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 35);
    expect(region.has(0)).toBe(true);
    expect(region.has(1)).toBe(true);
  });

  it("NEZAHRNIE trojuholník za ostrou hranou (uhol 90° > prah 35°)", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 35);
    expect(region.has(2)).toBe(false);
  });

  it("vráti len počiatočný trojuholník, ak nemá žiadnych susedov v rámci prahu", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    // Štart z trojuholníka 2 (kolmého) - jeho jediný sused (0) je za ostrou hranou.
    const region = floodFillRegion(mesh, 2, 35);
    expect(region.size).toBe(1);
    expect(region.has(2)).toBe(true);
  });

  it("pri vysokom prahu (napr. 100°) spojí aj kolmé plochy", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 100);
    expect(region.has(0)).toBe(true);
    expect(region.has(1)).toBe(true);
    expect(region.has(2)).toBe(true);
  });
});
