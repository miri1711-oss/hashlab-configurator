"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computeDimensionsFromGeometry } from "@/lib/stl";
import { ModelDimensions } from "@/lib/types";

interface STLViewerProps {
  file: File;
  onDimensions: (dimensions: ModelDimensions) => void;
  onError: () => void;
}

export default function STLViewer({ file, onDimensions, onError }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let disposed = false;
    let mesh: THREE.Mesh | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

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

    const reader = new FileReader();
    reader.onload = () => {
      if (disposed || !reader.result) return;
      try {
        const geometry = new STLLoader().parse(reader.result as ArrayBuffer);
        geometry.computeVertexNormals();
        geometry.center();

        onDimensions(computeDimensionsFromGeometry(geometry));

        const material = new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          metalness: 0.15,
          roughness: 0.4,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 32),
          new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.25 })
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
      } catch {
        onError();
      }
    };
    reader.onerror = () => onError();
    reader.readAsArrayBuffer(file);

    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
