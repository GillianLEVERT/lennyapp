"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import * as THREE from "three";
import { CHARACTERS, type CharacterId, type KidTheme } from "@/lib/themes";

interface BlobMascot3DProps {
  ui: KidTheme;
  size?: number;
  character?: CharacterId;
  interactiveRotate?: boolean;
}

interface SceneState {
  raf: number;
  blob: THREE.Group;
  rotation: number;
  targetRotation: number;
  dragging: boolean;
  startX: number;
  startY: number;
  startRotation: number;
  targetTilt: number;
  lastInteraction: number;
  reduced: boolean;
}

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  renderer.dispose();
  scene.traverse((item) => {
    const mesh = item as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });
}

export function BlobMascot3D({
  ui,
  size = 132,
  character,
  interactiveRotate = true,
}: BlobMascot3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<SceneState | null>(null);
  const hero = character ?? ui.character;
  const hitboxOutset = interactiveRotate ? Math.max(24, Math.round(size * 0.24)) : 0;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const S = ui.scene;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.25, 5.1);
    camera.lookAt(0, 0.95, 0);

    scene.add(new THREE.AmbientLight(S.light, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3.2, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(S.groundEdge), 1.1);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const blob = new THREE.Group();
    scene.add(blob);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.blob),
      roughness: 0.34,
      metalness: 0.04,
      emissive: new THREE.Color(S.blob),
      emissiveIntensity: ui.id === "cosmic" ? 0.22 : 0.07,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 36), bodyMat);
    body.position.y = 0.68;
    body.scale.set(0.95, 1.05, 0.9);
    body.castShadow = true;
    blob.add(body);

    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1f1638, roughness: 0.45 });
    function makeEye(x: number) {
      const eye = new THREE.Group();
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 18), eyeWhite);
      white.scale.set(0.82, 1.1, 0.34);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 14), pupilMat);
      pupil.position.set(0.01, -0.01, 0.075);
      pupil.scale.set(0.95, 1.08, 0.4);
      eye.add(white);
      eye.add(pupil);
      eye.position.set(x, 0.86, 0.67);
      return eye;
    }
    const eyeL = makeEye(-0.25);
    const eyeR = makeEye(0.25);
    blob.add(eyeL);
    blob.add(eyeR);

    const cheekMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.cheek),
      roughness: 0.55,
      transparent: true,
      opacity: 0.7,
    });
    [-0.43, 0.43].forEach((x) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), cheekMat);
      cheek.position.set(x, 0.66, 0.62);
      cheek.scale.set(1, 0.72, 0.32);
      blob.add(cheek);
    });

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.018, 8, 24, Math.PI),
      pupilMat
    );
    mouth.position.set(0, 0.54, 0.73);
    mouth.rotation.set(0, 0, Math.PI);
    mouth.scale.x = 0.9;
    blob.add(mouth);

    const armMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.blob),
      roughness: 0.36,
      emissive: new THREE.Color(S.blob),
      emissiveIntensity: 0.04,
    });
    const handMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.blobLit),
      roughness: 0.3,
    });
    function makeArm(side: number) {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.36, 7, 14), armMat);
      upper.position.y = -0.25;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), handMat);
      hand.position.y = -0.52;
      arm.add(upper);
      arm.add(hand);
      arm.position.set(side * 0.72, 0.72, 0.14);
      arm.rotation.z = side * 0.55;
      return arm;
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);
    blob.add(armL);
    blob.add(armR);

    const hat = new THREE.Group();
    hat.position.set(0, 1.36, 0.1);
    const trimC = new THREE.Color(CHARACTERS[hero].trim);
    if (hero === "pirate") {
      const dark = new THREE.MeshStandardMaterial({ color: 0x241f30, roughness: 0.72 });
      const trimMat = new THREE.MeshStandardMaterial({ color: trimC, roughness: 0.42 });
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xfff4e8, roughness: 0.55 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.88, 0.08, 32), dark);
      brim.position.y = 0.02;
      brim.scale.z = 0.68;
      brim.castShadow = true;
      hat.add(brim);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({ color: 0x312a42, roughness: 0.68 })
      );
      dome.position.y = 0.03;
      dome.scale.set(1, 0.68, 0.82);
      dome.castShadow = true;
      hat.add(dome);

      const frontFold = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.18, 0.08), dark);
      frontFold.position.set(0, 0.15, 0.5);
      frontFold.rotation.x = 0.55;
      hat.add(frontFold);
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), dark);
        wing.position.set(side * 0.48, 0.12, -0.1);
        wing.rotation.set(0.2, 0, side * 0.55);
        hat.add(wing);
      });

      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.48, 12), trimMat);
      plume.position.set(0.2, 0.36, -0.18);
      plume.rotation.set(-0.5, 0, -0.42);
      hat.add(plume);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), boneMat);
      skull.position.set(0, 0.15, 0.48);
      skull.scale.z = 0.5;
      hat.add(skull);
      [-0.04, 0.04].forEach((x) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), pupilMat);
        eye.position.set(x, 0.16, 0.54);
        hat.add(eye);
      });
    } else if (hero === "chevalier") {
      const steel = new THREE.MeshStandardMaterial({
        color: 0xb8c1ce,
        roughness: 0.25,
        metalness: 0.68,
      });
      const darkSteel = new THREE.MeshStandardMaterial({
        color: 0x6f7a8f,
        roughness: 0.34,
        metalness: 0.55,
      });
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.63),
        steel
      );
      helm.position.y = -0.08;
      helm.scale.set(1, 0.92, 0.9);
      helm.castShadow = true;
      hat.add(helm);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.22), darkSteel);
      visor.position.set(0, 0.04, 0.5);
      visor.castShadow = true;
      hat.add(visor);
      [-0.24, 0, 0.24].forEach((x) => {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.03), pupilMat);
        slit.position.set(x, 0.06, 0.62);
        hat.add(slit);
      });
      const noseGuard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), darkSteel);
      noseGuard.position.set(0, -0.08, 0.58);
      hat.add(noseGuard);
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.46, 12),
        new THREE.MeshStandardMaterial({ color: trimC, roughness: 0.5 })
      );
      plume.position.set(0, 0.42, -0.08);
      plume.rotation.x = -0.3;
      hat.add(plume);
    } else if (hero === "dragon") {
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x3f7f42, roughness: 0.48 });
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x5fbf5b,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfff2b6, roughness: 0.36 });
      const hood = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
        hoodMat
      );
      hood.position.y = -0.08;
      hood.scale.set(1, 0.8, 0.9);
      hat.add(hood);
      [-0.28, 0.28].forEach((x) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.34, 12), hornMat);
        horn.position.set(x, 0.34, 0.04);
        horn.rotation.z = x < 0 ? 0.42 : -0.42;
        hat.add(horn);
      });
      [-0.18, 0, 0.18].forEach((x, index) => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 9), wingMat);
        spike.position.set(x, 0.34 + index * 0.02, -0.11);
        spike.rotation.x = -0.35;
        hat.add(spike);
      });
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.52, 3), wingMat);
        wing.position.set(side * 0.66, -0.12, -0.04);
        wing.rotation.set(0.28, 0, side * 0.72);
        wing.scale.set(0.95, 1.12, 0.42);
        hat.add(wing);
      });
    } else {
      const gold = new THREE.MeshStandardMaterial({
        color: 0xffd23d,
        roughness: 0.24,
        metalness: 0.7,
        side: THREE.DoubleSide,
      });
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.55, 0.22, 28, 1, true),
        gold
      );
      band.position.y = 0.02;
      band.castShadow = true;
      hat.add(band);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.3, 12), gold);
        spike.position.set(Math.cos(angle) * 0.47, 0.28, Math.sin(angle) * 0.48);
        spike.rotation.z = Math.cos(angle) * -0.08;
        spike.castShadow = true;
        hat.add(spike);
      }
      const jewel = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: trimC,
          roughness: 0.1,
          emissive: trimC,
          emissiveIntensity: 0.45,
        })
      );
      jewel.position.set(0, 0.08, 0.53);
      hat.add(jewel);
    }
    blob.add(hat);

    const silver = new THREE.MeshStandardMaterial({
      color: 0xd4dae3,
      roughness: 0.22,
      metalness: 0.85,
    });
    const woodGrip = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.62 });
    const flame = new THREE.Group();
    if (hero === "pirate") {
      const prop = new THREE.Group();
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 12), woodGrip);
      cuff.position.y = -0.6;
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 10, 20, Math.PI * 1.45), silver);
      hook.position.set(0, -0.82, 0);
      hook.rotation.set(Math.PI / 2, 0, Math.PI * 0.08);
      prop.add(cuff);
      prop.add(hook);
      armR.add(prop);
    } else if (hero === "chevalier") {
      const sword = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.62, 0.04), silver);
      blade.position.y = -1.02;
      blade.castShadow = true;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.14, 4), silver);
      tip.position.y = -1.4;
      tip.rotation.y = Math.PI / 4;
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.06, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.28, metalness: 0.65 })
      );
      guard.position.y = -0.68;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.18, 8), woodGrip);
      grip.position.y = -0.58;
      sword.add(blade);
      sword.add(tip);
      sword.add(guard);
      sword.add(grip);
      armR.add(sword);
    } else if (hero === "dragon") {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8),
        woodGrip
      );
      stick.position.y = -0.58;
      const outer = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.34, 18),
        new THREE.MeshStandardMaterial({
          color: 0xff8a3d,
          roughness: 0.24,
          emissive: 0xff6b1a,
          emissiveIntensity: 0.58,
        })
      );
      outer.position.y = -0.87;
      outer.rotation.x = Math.PI;
      const inner = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.19, 14),
        new THREE.MeshStandardMaterial({
          color: 0xfff2b6,
          roughness: 0.2,
          emissive: 0xffd27a,
          emissiveIntensity: 0.78,
        })
      );
      inner.position.y = -0.82;
      inner.rotation.x = Math.PI;
      flame.add(stick);
      flame.add(outer);
      flame.add(inner);
      armR.add(flame);
    } else {
      const wand = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.28, metalness: 0.55 })
      );
      stick.position.y = -0.82;
      const star = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: trimC,
          roughness: 0.1,
          emissive: trimC,
          emissiveIntensity: 0.75,
        })
      );
      star.position.y = -1.1;
      wand.add(stick);
      wand.add(star);
      armR.add(wand);
    }

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 36),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.16, 0);
    scene.add(shadow);

    const state: SceneState = {
      raf: 0,
      blob,
      rotation: 0,
      targetRotation: 0,
      dragging: false,
      startX: 0,
      startY: 0,
      startRotation: 0,
      targetTilt: 0,
      lastInteraction: 0,
      reduced,
    };
    stateRef.current = state;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    function frame() {
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, clock.getDelta());
      if (!state.reduced) {
        blob.position.y = Math.sin(t * 2.1) * 0.055;
        const breath = 1 + Math.sin(t * 2.5) * 0.028;
        body.scale.set(0.95 + Math.sin(t * 1.9) * 0.025, 1.05 * breath, 0.9);
        armL.rotation.z = -0.58 + Math.sin(t * 2.4) * 0.12;
        armR.rotation.z = 0.58 - Math.sin(t * 2.4) * 0.12;
        const blink = Math.sin(t * 3.4) > 0.965 ? 0.16 : 1;
        eyeL.scale.y += (blink - eyeL.scale.y) * Math.min(1, dt * 18);
        eyeR.scale.y += (blink - eyeR.scale.y) * Math.min(1, dt * 18);
        flame.scale.setScalar(1 + Math.sin(t * 12) * 0.06);
      }
      if (!state.dragging && t - state.lastInteraction > 1.4) {
        state.targetRotation += dt * 0.18;
      }
      state.rotation += (state.targetRotation - state.rotation) * Math.min(1, dt * 12);
      blob.rotation.y = state.rotation;
      blob.rotation.x += (state.targetTilt - blob.rotation.x) * Math.min(1, dt * 10);
      shadow.scale.setScalar(1 + Math.sin(t * 2.1) * 0.035);
      renderer.render(scene, camera);
      state.raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      stateRef.current = null;
      disposeScene(scene, renderer);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [hero, size, ui.id, ui.scene, interactiveRotate]);

  function startRotate(event: PointerEvent<HTMLDivElement>) {
    const state = stateRef.current;
    if (!interactiveRotate || !state) return;
    state.dragging = true;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startRotation = state.targetRotation;
    state.lastInteraction = performance.now() / 1000;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function rotate(event: PointerEvent<HTMLDivElement>) {
    const state = stateRef.current;
    if (!interactiveRotate || !state?.dragging) return;
    state.targetRotation = state.startRotation + (event.clientX - state.startX) * 0.018;
    state.targetTilt = THREE.MathUtils.clamp((event.clientY - state.startY) * 0.006, -0.35, 0.35);
    state.rotation = state.targetRotation;
    state.blob.rotation.y = state.rotation;
    state.blob.rotation.x = state.targetTilt;
    state.lastInteraction = performance.now() / 1000;
  }

  function stopRotate(event: PointerEvent<HTMLDivElement>) {
    const state = stateRef.current;
    if (!interactiveRotate || !state) return;
    state.dragging = false;
    state.targetTilt = 0;
    state.lastInteraction = performance.now() / 1000;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function rotateWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const state = stateRef.current;
    if (!interactiveRotate || !state) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      state.targetRotation += event.key === "ArrowLeft" ? -0.35 : 0.35;
      state.rotation = state.targetRotation;
      state.blob.rotation.y = state.rotation;
      state.lastInteraction = performance.now() / 1000;
    }
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
    >
      <div
        ref={mountRef}
        role={interactiveRotate ? "img" : undefined}
        aria-label={interactiveRotate ? "Mascotte blob 3D interactive" : undefined}
        tabIndex={interactiveRotate ? 0 : undefined}
        onPointerDown={startRotate}
        onPointerMove={rotate}
        onPointerUp={stopRotate}
        onPointerCancel={stopRotate}
        onLostPointerCapture={() => {
          if (stateRef.current) stateRef.current.dragging = false;
        }}
        onKeyDown={rotateWithKeyboard}
        style={{
          position: "absolute",
          inset: -hitboxOutset,
          cursor: interactiveRotate ? "grab" : "default",
          touchAction: interactiveRotate ? "none" : "auto",
          userSelect: "none",
          outline: "none",
        }}
      />
    </div>
  );
}
