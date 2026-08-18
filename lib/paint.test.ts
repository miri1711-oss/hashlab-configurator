import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { buildTriangleMeshData, floodFillRegion } from "./paint";

/**
 * Vytvorí testovaciu geometriu so 4 trojuholníkmi:
 * - trojuholník 0 a 1 tvoria spolu rovný štvorec (rovnaká rovina, uhol 0°)
 * - trojuholník 2 je kolmo napojený na trojuholník 0 (zdieľajú hranu,
 *   ale sú na seba kolmé, uhol 90°) - simuluje napr. bočnú stenu QR kódu
 *   napojenú na plochý stojan (mala by sa zafarbiť ako "bok" navyše).
 * - trojuholník 3 je napojený len na trojuholník 2 (nie priamo na 0/1) -
 *   simuluje napr. základnú doštičku pod bočnou stenou, ktorá by sa už
 *   NEMALA zafarbiť (je "druhý krok" od miesta kliknutia).
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
    // trojuholník 3 - zdieľa hranu (1,1,0)-(1,1,1) s trojuholníkom 2, nie s 0/1
    1, 1, 0,  1, 1, 1,  1, 2, 1,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

describe("buildTriangleMeshData", () => {
  it("správne rozpozná susedné trojuholníky podľa zdieľaných hrán", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    expect(mesh.triangleCount).toBe(4);
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

  it("zahrnie aj bezprostredný bok za ostrou hranou (napr. bočnú stenu QR kódu)", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 35);
    expect(region.has(2)).toBe(true);
  });

  it("NEROZŠÍRI výber ďalej za bok (napr. na základnú doštičku pod bokom)", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 35);
    expect(region.has(3)).toBe(false);
  });

  it("pri vysokom prahu (napr. 100°) spojí aj kolmé plochy bežným výberom", () => {
    const mesh = buildTriangleMeshData(buildTestGeometry());
    const region = floodFillRegion(mesh, 0, 100);
    expect(region.has(0)).toBe(true);
    expect(region.has(1)).toBe(true);
    expect(region.has(2)).toBe(true);
  });
});
