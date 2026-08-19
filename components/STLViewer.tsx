"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computeDimensionsFromGeometry } from "@/lib/stl";
import { buildTriangleMeshData, floodFillRegion, TriangleMeshData } from "@/lib/paint";
import { ModelDimensions } from "@/lib/types";

interface STLViewerProps {
  file: File;
  colorHex: number;
  paintMode: boolean;
  paintColorHex: number;
  resetPaintSignal: number;
  undoPaintSignal: number;
  onDimensions: (dimensions: ModelDimensions) => void;
  onError: () => void;
  onPaintApplied?: () => void;
}

export interface STLViewerHandle {
  /** Vrati aktualny obraz 3D nahladu (vratane namalovanych farieb) ako PNG data URL, alebo null ak nie je este pripraveny. */
  captureSnapshot: () => string | null;
}

const CLICK_MOVE_THRESHOLD_PX = 6;

const STLViewer = forwardRef<STLViewerHandle, STLViewerProps>(function STLViewer(
  {
    file,
    colorHex,
    paintMode,
    paintColorHex,
    resetPaintSignal,
    undoPaintSignal,
    onDimensions,
    onError,
    onPaintApplied,
  },
  forwardedRef
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const triangleOverridesRef = useRef<Map<number, THREE.Color>>(new Map());
  // História kliknutí pri maľovaní - každý záznam si pamätá, akú farbu mali
  // dotknuté trojuholníky PRED týmto klikom, aby sa dal krok vrátiť späť.
  const paintHistoryRef = useRef<Map<number, THREE.Color | null>[]>([]);
  const meshDataRef = useRef<TriangleMeshData | null>(null);
  const baseColorRef = useRef(new THREE.Color(colorHex));
  const paintColorRef = useRef(new THREE.Color(paintColorHex));
  const paintModeRef = useRef(paintMode);
  const rebuildColorsRef = useRef<() => void>(() => {});

  useImperativeHandle(forwardedRef, () => ({
    captureSnapshot: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;
      // Vynutene prekreslenie tesne pred zachytenim, nech mame isto
      // najaktualnejsi obraz (vratane prave namalovanych farieb).
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    },
  }));

  useEffect(() => {
    baseColorRef.current.setHex(colorHex);
    rebuildColorsRef.current();
  }, [colorHex]);
  useEffect(() => {
    paintColorRef.current.setHex(paintColorHex);
  }, [paintColorHex]);
  useEffect(() => {
    paintModeRef.current = paintMode;
  }, [paintMode]);

  // Vymazanie namaľovaných oblastí na požiadanie (tlačidlo "Vymazať maľovanie").
  useEffect(() => {
    triangleOverridesRef.current.clear();
    paintHistoryRef.current = [];
    rebuildColorsRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetPaintSignal]);

  // Vrátenie posledného kliknutia pri maľovaní (tlačidlo "Krok späť").
  useEffect(() => {
    const lastAction = paintHistoryRef.current.pop();
    if (!lastAction) return;
    for (const [triangleIndex, previousColor] of lastAction) {
      if (previousColor) {
        triangleOverridesRef.current.set(triangleIndex, previousColor);
      } else {
        triangleOverridesRef.current.delete(triangleIndex);
      }
    }
    rebuildColorsRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoPaintSignal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let disposed = false;
    triangleOverridesRef.current = new Map();
    paintHistoryRef.current = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0x9fc9ff, 0.75));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(1, 1.4, 1);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-1, -0.4, -1);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;
    controls.enablePan = false;

    function resize() {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    }
    resize();
    window.addEventListener("resize", resize);

    // ResizeObserver zachyti aj zmenu velkosti samotneho kontajnera (napr.
    // prepnutie do celoobrazovkoveho nahladu), ktora nevyvola udalost
    // "resize" na window - bez tohto by canvas zostal v starej velkosti a
    // model by sa zobrazil zle umiestneny (napr. v rohu).
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const raycaster = new THREE.Raycaster();
    let mesh: THREE.Mesh | null = null;
    let pointerDownPos: { x: number; y: number } | null = null;

    function rebuildColors() {
      const attr = colorAttrRef.current;
      const meshData = meshDataRef.current;
      if (!attr || !meshData) return;
      const overrides = triangleOverridesRef.current;

      for (let t = 0; t < meshData.triangleCount; t++) {
        const c = overrides.get(t) ?? baseColorRef.current;
        for (let v = 0; v < 3; v++) {
          const idx = t * 3 + v;
          attr.setXYZ(idx, c.r, c.g, c.b);
        }
      }
      attr.needsUpdate = true;
    }
    rebuildColorsRef.current = rebuildColors;

    function handlePointerDown(e: PointerEvent) {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    }

    function handlePointerUp(e: PointerEvent) {
      if (!paintModeRef.current || !mesh || !pointerDownPos) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.hypot(dx, dy) > CLICK_MOVE_THRESHOLD_PX) return; // bol to ťah kamery, nie klik

      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(mesh, false);
      const meshData = meshDataRef.current;
      if (!hits.length || hits[0].faceIndex === undefined || !meshData) return;

      const region = floodFillRegion(meshData, hits[0].faceIndex, 55);
      const previousState = new Map<number, THREE.Color | null>();
      for (const t of region) {
        previousState.set(t, triangleOverridesRef.current.get(t)?.clone() ?? null);
        triangleOverridesRef.current.set(t, paintColorRef.current.clone());
      }
      paintHistoryRef.current.push(previousState);
      rebuildColors();
      onPaintApplied?.();
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    /**
     * OBJ subor moze obsahovat viac samostatnych objektov (kazdy so svojou
     * geometriou) - zluci ich do jednej geometrie, aby sa dala pouzit ten
     * isty dalsi kod (farbenie, malovanie, vypocet rozmerov) ako pri STL,
     * ktore je vzdy jedna "trojuholnikova polievka" bez indexovania.
     */
    function mergeObjGroupIntoGeometry(group: THREE.Group): THREE.BufferGeometry {
      const partGeometries: THREE.BufferGeometry[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geom = child.geometry as THREE.BufferGeometry;
          const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
          const positionOnly = new THREE.BufferGeometry();
          positionOnly.setAttribute("position", nonIndexed.getAttribute("position"));
          partGeometries.push(positionOnly);
        }
      });
      const merged = mergeGeometries(partGeometries, false);
      return merged ?? new THREE.BufferGeometry();
    }

    function finishLoadingGeometry(geometry: THREE.BufferGeometry) {
      geometry.computeVertexNormals();
      geometry.center();

      onDimensions(computeDimensionsFromGeometry(geometry));

      const meshData = buildTriangleMeshData(geometry);
      meshDataRef.current = meshData;

      const colorArray = new Float32Array(geometry.getAttribute("position").count * 3);
      const colorAttr = new THREE.BufferAttribute(colorArray, 3);
      geometry.setAttribute("color", colorAttr);
      colorAttrRef.current = colorAttr;
      rebuildColors();

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.15,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 32),
        new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.2 })
      );
      mesh.add(edges);

      geometry.computeBoundingSphere();
      const radius = geometry.boundingSphere?.radius || 50;
      camera.position.set(radius * 1.7, radius * 1.3, radius * 1.7);
      camera.near = radius / 100;
      camera.far = radius * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    }

    const isObj = file.name.toLowerCase().endsWith(".obj");
    const reader = new FileReader();
    reader.onload = () => {
      if (disposed || !reader.result) return;
      try {
        const geometry = isObj
          ? mergeObjGroupIntoGeometry(new OBJLoader().parse(reader.result as string))
          : new STLLoader().parse(reader.result as ArrayBuffer);
        finishLoadingGeometry(geometry);
      } catch {
        onError();
      }
    };
    reader.onerror = () => onError();
    if (isObj) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.autoRotate = !paintModeRef.current;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      colorAttrRef.current = null;
      meshDataRef.current = null;
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${paintMode ? "cursor-crosshair" : ""}`}
    />
  );
});

export default STLViewer;
