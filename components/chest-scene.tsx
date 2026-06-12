"use client";

// Scène 3D du coffre (Three.js), portée depuis le prototype Claude Design.
// Le blob marche vers le coffre, saute, et l'ouvre : particules, gemme, flash.
// `reduced` saute la marche et ouvre directement (prefers-reduced-motion).

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CHARACTERS, type CharacterId, type KidTheme } from "@/lib/themes";

interface ChestSceneProps {
  ui: KidTheme;
  play: boolean;
  reduced: boolean;
  intensity?: number;
  character?: CharacterId;
  onOpened?: () => void;
}

type Phase = "idle" | "walk" | "approach" | "jump" | "open";

interface SceneApi {
  start: (reducedNow: boolean) => void;
  reset: () => void;
}

interface Particle {
  m: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  life: number;
}

export function ChestScene({
  ui,
  play,
  reduced,
  intensity = 1,
  character,
  onOpened,
}: ChestSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const onOpenedRef = useRef(onOpened);
  const intensityRef = useRef(intensity);
  const hero = character ?? ui.character;

  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // (re)construit la scène quand le thème, le blob ou le personnage change
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const S = ui.scene;

    const W = () => mount.clientWidth || 800;
    const H = () => mount.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(S.fog, 9, 20);

    const camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 100);
    camera.position.set(0, 3.0, 8.2);
    camera.lookAt(0, 1.1, 0);

    /* lumières */
    scene.add(new THREE.AmbientLight(S.light, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(S.groundEdge), 0.6);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const chestGlow = new THREE.PointLight(new THREE.Color(S.gemGlow), 0, 8);
    chestGlow.position.set(0, 1.4, 0.2);
    scene.add(chestGlow);

    /* sol */
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.ground),
      roughness: 0.95,
      metalness: 0,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(13, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    // anneau lumineux
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(S.groundEdge),
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.18, 64), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    /* étoiles d'ambiance */
    const starGeo = new THREE.BufferGeometry();
    const starN = 140;
    const sp = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 26;
      sp[i * 3 + 1] = Math.random() * 12 + 1;
      sp[i * 3 + 2] = -6 - Math.random() * 12;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: new THREE.Color(S.sparkle),
        size: 0.12,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      })
    );
    scene.add(stars);

    /* ---------- BLOB ---------- */
    const blob = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.blob),
      roughness: 0.35,
      metalness: 0.05,
      emissive: new THREE.Color(S.blob),
      emissiveIntensity: ui.id === "cosmic" ? 0.25 : 0.08,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 32), bodyMat);
    body.castShadow = true;
    body.position.y = 0.62;
    blob.add(body);
    // yeux
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const pupil = new THREE.MeshStandardMaterial({ color: 0x1f1638, roughness: 0.5 });
    function makeEye(x: number) {
      const g = new THREE.Group();
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), eyeWhite);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 14), pupil);
      p.position.set(0, 0, 0.11);
      g.add(w);
      g.add(p);
      g.position.set(x, 0.72, 0.5);
      return g;
    }
    const eyeL = makeEye(-0.2);
    const eyeR = makeEye(0.2);
    blob.add(eyeL);
    blob.add(eyeR);
    // joues
    const cheekMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.cheek),
      roughness: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const ck1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), cheekMat);
    ck1.position.set(-0.34, 0.56, 0.42);
    ck1.scale.set(1, 0.7, 0.4);
    const ck2 = ck1.clone();
    ck2.position.x = 0.34;
    blob.add(ck1);
    blob.add(ck2);

    // bras (oscillent à la marche)
    const armMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.blob),
      roughness: 0.35,
      emissive: new THREE.Color(S.blob),
      emissiveIntensity: ui.id === "cosmic" ? 0.2 : 0.05,
    });
    function makeArm(side: number) {
      const g = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 6, 12), armMat);
      upper.position.y = -0.26;
      upper.castShadow = true;
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 14),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(S.blobLit), roughness: 0.3 })
      );
      hand.position.y = -0.5;
      g.add(upper);
      g.add(hand);
      g.position.set(side * 0.58, 0.72, 0.12);
      g.rotation.z = side * 0.35;
      return g;
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);
    blob.add(armL);
    blob.add(armR);

    // chapeau du personnage
    const hat = new THREE.Group();
    hat.position.set(0, 1.14, 0.05);
    const trimC = new THREE.Color(CHARACTERS[hero].trim);
    if (hero === "pirate") {
      const dark = new THREE.MeshStandardMaterial({ color: 0x241f30, roughness: 0.7 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.78, 0.07, 28), dark);
      brim.position.y = 0.05;
      brim.scale.z = 0.76;
      brim.castShadow = true;
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x312a42, roughness: 0.7 })
      );
      crown.position.y = 0.05;
      crown.scale.y = 0.6;
      // bord relevé devant (tricorne)
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), dark);
      front.position.set(0, 0.16, 0.5);
      front.rotation.x = 0.5;
      // plume
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.42, 10),
        new THREE.MeshStandardMaterial({ color: trimC, roughness: 0.5 })
      );
      plume.position.set(0.16, 0.34, -0.18);
      plume.rotation.set(-0.5, 0, -0.45);
      // crâne
      const skull = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 14),
        new THREE.MeshStandardMaterial({ color: 0xfff4e8, roughness: 0.5 })
      );
      skull.position.set(0, 0.13, 0.4);
      skull.scale.z = 0.6;
      hat.add(brim);
      hat.add(crown);
      hat.add(front);
      hat.add(plume);
      hat.add(skull);
    } else if (hero === "chevalier") {
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
        new THREE.MeshStandardMaterial({ color: 0xaeb6c4, roughness: 0.3, metalness: 0.6 })
      );
      helm.position.y = -0.04;
      helm.castShadow = true;
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.12, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x7c869a, roughness: 0.4, metalness: 0.5 })
      );
      visor.position.set(0, 0.04, 0.06);
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: trimC, roughness: 0.5 })
      );
      plume.position.set(0, 0.42, -0.1);
      plume.rotation.x = -0.3;
      hat.add(helm);
      hat.add(visor);
      hat.add(plume);
    } else {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.46, 0.22, 24, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xffd23d,
          roughness: 0.25,
          metalness: 0.7,
          side: THREE.DoubleSide,
        })
      );
      band.position.y = 0.12;
      band.castShadow = true;
      hat.add(band);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.22, 10),
          new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.25, metalness: 0.7 })
        );
        spike.position.set(Math.cos(a) * 0.43, 0.3, Math.sin(a) * 0.46);
        hat.add(spike);
      }
      const jewel = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1, 0),
        new THREE.MeshStandardMaterial({
          color: trimC,
          roughness: 0.1,
          emissive: trimC,
          emissiveIntensity: 0.4,
        })
      );
      jewel.position.set(0, 0.12, 0.46);
      hat.add(jewel);
    }
    blob.add(hat);

    // accessoire tenu dans la main droite (suit le bras)
    const silver = new THREE.MeshStandardMaterial({ color: 0xd4dae3, roughness: 0.22, metalness: 0.85 });
    const woodGrip = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.6 });
    if (hero === "pirate") {
      const prop = new THREE.Group();
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.13, 12), woodGrip);
      cuff.position.y = -0.56;
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 10, 18, Math.PI * 1.45), silver);
      hook.position.set(0, -0.78, 0);
      hook.rotation.set(Math.PI / 2, 0, Math.PI * 0.1);
      prop.add(cuff);
      prop.add(hook);
      armR.add(prop);
    } else if (hero === "chevalier") {
      const sword = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.04), silver);
      blade.position.y = -1.0;
      blade.castShadow = true;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), silver);
      tip.position.y = -1.34;
      tip.rotation.y = Math.PI / 4;
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.06, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.3, metalness: 0.6 })
      );
      guard.position.y = -0.68;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), woodGrip);
      grip.position.y = -0.58;
      sword.add(blade);
      sword.add(tip);
      sword.add(guard);
      sword.add(grip);
      armR.add(sword);
    } else {
      const wand = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.52, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.3, metalness: 0.6 })
      );
      stick.position.y = -0.8;
      const star = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.11, 0),
        new THREE.MeshStandardMaterial({
          color: trimC,
          emissive: trimC,
          emissiveIntensity: 0.7,
          roughness: 0.1,
        })
      );
      star.position.y = -1.06;
      wand.add(stick);
      wand.add(star);
      armR.add(wand);
    }

    blob.position.set(-4.4, 0, 0.4);
    scene.add(blob);

    /* ---------- COFFRE ---------- */
    const chest = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.chestBody),
      roughness: 0.6,
      metalness: 0.1,
    });
    const lidMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.chestLid),
      roughness: 0.55,
      metalness: 0.1,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.chestMetal),
      roughness: 0.3,
      metalness: 0.7,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 1.15), woodMat);
    base.position.y = 0.55;
    base.castShadow = true;
    base.receiveShadow = true;
    chest.add(base);
    // bandes métal
    [-0.62, 0.62].forEach((x) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 1.2), metalMat);
      b.position.set(x, 0.55, 0);
      b.castShadow = true;
      chest.add(b);
    });
    // serrure / gemme avant
    const lockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.gem),
      roughness: 0.15,
      metalness: 0.2,
      emissive: new THREE.Color(S.gemGlow),
      emissiveIntensity: 0.5,
    });
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.12), lockMat);
    lock.position.set(0, 0.5, 0.6);
    chest.add(lock);

    // emblème du personnage sur le devant du coffre
    const embMat = new THREE.MeshStandardMaterial({
      color: trimC,
      roughness: 0.3,
      metalness: 0.4,
      emissive: new THREE.Color(S.gemGlow),
      emissiveIntensity: 0.15,
    });
    if (hero === "pirate") {
      const sk = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 14),
        new THREE.MeshStandardMaterial({ color: 0xfff4e8, roughness: 0.5 })
      );
      sk.position.set(0, 0.78, 0.62);
      sk.scale.z = 0.6;
      chest.add(sk);
      [
        [-0.06, 0.78],
        [0.06, 0.78],
      ].forEach(([x, y]) => {
        const e = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0x272233 })
        );
        e.position.set(x, y, 0.74);
        chest.add(e);
      });
    } else if (hero === "chevalier") {
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.08, 6), embMat);
      shield.position.set(0, 0.78, 0.62);
      shield.rotation.x = Math.PI / 2;
      chest.add(shield);
    } else {
      const heart = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), embMat);
      heart.position.set(-0.06, 0.8, 0.62);
      const heart2 = heart.clone();
      heart2.position.x = 0.06;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 12), embMat);
      tip.position.set(0, 0.66, 0.62);
      tip.rotation.x = Math.PI;
      chest.add(heart);
      chest.add(heart2);
      chest.add(tip);
    }

    // couvercle (pivot sur l'arête arrière haute)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 1.02, -0.58);
    const lidTop = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.28, 1.18), lidMat);
    lidTop.position.set(0, 0.16, 0.58);
    lidTop.castShadow = true;
    lidPivot.add(lidTop);
    const lidBand = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.12, 0.18), metalMat);
    lidBand.position.set(0, 0.22, 0.58 + 0.5);
    lidPivot.add(lidBand);
    chest.add(lidPivot);

    // lueur intérieure (plan)
    const innerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(S.gemGlow),
      transparent: true,
      opacity: 0,
    });
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), innerMat);
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(0, 1.04, 0);
    chest.add(inner);

    chest.position.set(1.3, 0, 0);
    scene.add(chest);

    /* ---------- GEMME / RÉCOMPENSE ---------- */
    const gemMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(S.gem),
      roughness: 0.05,
      metalness: 0.3,
      emissive: new THREE.Color(S.gemGlow),
      emissiveIntensity: 0.9,
    });
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), gemMat);
    gem.position.set(1.3, 1.0, 0);
    gem.scale.setScalar(0.001);
    gem.castShadow = true;
    scene.add(gem);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.62, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(S.sparkle),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    halo.position.copy(gem.position);
    scene.add(halo);

    /* ---------- PARTICULES (pool fixe, fraction activée selon l'intensité) ---------- */
    const pCount = 108; // pool max (= 72 * 1.5)
    const particles: Particle[] = [];
    const pCols = S.particles.map((c) => new THREE.Color(c));
    const geos = [
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.TetrahedronGeometry(0.11),
      new THREE.SphereGeometry(0.08, 8, 6),
    ];
    for (let i = 0; i < pCount; i++) {
      const m = new THREE.Mesh(
        geos[i % geos.length],
        new THREE.MeshStandardMaterial({
          color: pCols[i % pCols.length],
          roughness: 0.4,
          emissive: pCols[i % pCols.length],
          emissiveIntensity: 0.3,
          transparent: true,
        })
      );
      m.visible = false;
      scene.add(m);
      particles.push({ m, vel: new THREE.Vector3(), rot: new THREE.Vector3(), life: 0 });
    }
    function burst() {
      const origin = new THREE.Vector3(1.3, 1.15, 0);
      const active = Math.round(72 * Math.max(0, intensityRef.current));
      particles.forEach((p, i) => {
        if (i >= active) {
          p.m.visible = false;
          p.life = 0;
          return;
        }
        p.m.visible = true;
        p.m.position.copy(origin);
        const a = Math.random() * Math.PI * 2;
        const up = 3.2 + Math.random() * 3.2;
        const out = 1.4 + Math.random() * 2.6;
        p.vel.set(Math.cos(a) * out, up, Math.sin(a) * out);
        p.rot.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        p.m.material.opacity = 1;
        p.m.scale.setScalar(0.7 + Math.random() * 0.9);
        p.life = 1;
      });
    }

    /* ---------- état / timeline ---------- */
    const st = {
      phase: "idle" as Phase,
      t: 0,
      opened: false,
      flash: 0,
      raf: 0,
      blink: 0,
      walkStartX: -4.4,
      chestX: 1.3,
    };
    apiRef.current = {
      start(reducedNow: boolean) {
        st.phase = reducedNow ? "open" : "walk";
        st.t = 0;
        st.opened = false;
        if (reducedNow) {
          burst();
          st.flash = 1;
        }
      },
      reset() {
        st.phase = "idle";
        st.t = 0;
        st.opened = false;
        st.flash = 0;
        blob.position.set(-4.4, 0, 0.4);
        blob.scale.set(1, 1, 1);
        blob.rotation.y = 0;
        armL.rotation.set(0, 0, -0.35);
        armR.rotation.set(0, 0, 0.35);
        lidPivot.rotation.x = 0;
        gem.scale.setScalar(0.001);
        innerMat.opacity = 0;
        chestGlow.intensity = 0;
        halo.material.opacity = 0;
        particles.forEach((p) => {
          p.m.visible = false;
          p.life = 0;
        });
      },
    };

    function resize() {
      renderer.setSize(W(), H());
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    function frame() {
      st.raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      const tt = clock.elapsedTime;

      // idle bob + blink toujours
      st.blink += dt;
      const blinking = st.blink % 3.5 > 3.5 - 0.12;
      eyeL.scale.y = eyeR.scale.y = blinking ? 0.1 : 1;
      stars.rotation.y += dt * 0.01;
      ring.material.opacity = 0.4 + Math.sin(tt * 2) * 0.12;
      gem.rotation.y += dt * 1.4;
      gem.rotation.x += dt * 0.5;
      halo.lookAt(camera.position);

      if (st.phase === "idle") {
        blob.position.y = Math.sin(tt * 2.2) * 0.06;
        const sq = 1 + Math.sin(tt * 2.2) * 0.04;
        blob.scale.set(2 - sq, sq, 2 - sq);
        blob.position.x = -4.4 + Math.sin(tt * 0.6) * 0.15;
      } else if (st.phase === "walk") {
        st.t += dt;
        const dur = 2.4;
        const k = Math.min(1, st.t / dur);
        blob.position.x = st.walkStartX + (st.chestX - 1.6 - st.walkStartX) * k;
        // pas sautillés
        const hop = Math.abs(Math.sin(k * Math.PI * 7));
        blob.position.y = hop * 0.34;
        const stretch = 1 + (0.5 - hop) * 0.22;
        blob.scale.set(2 - stretch, stretch, 2 - stretch);
        blob.rotation.y = Math.sin(k * Math.PI * 7) * 0.12;
        if (k >= 1) {
          st.phase = "approach";
          st.t = 0;
        }
      } else if (st.phase === "approach") {
        st.t += dt;
        blob.position.y = Math.sin(tt * 3) * 0.05;
        blob.scale.set(1, 1, 1);
        if (st.t > 0.4) {
          st.phase = "jump";
          st.t = 0;
        }
      } else if (st.phase === "jump") {
        st.t += dt;
        const k = Math.min(1, st.t / 0.55);
        // anticipation + saut
        const y = k < 0.3 ? -0.12 * (k / 0.3) : 1.0 * Math.sin(((k - 0.3) / 0.7) * Math.PI);
        blob.position.y = Math.max(0, y);
        const sc = k < 0.3 ? 1 - 0.18 * (k / 0.3) : 1 + 0.12 * Math.sin(((k - 0.3) / 0.7) * Math.PI);
        blob.scale.set(2 - sc, sc, 2 - sc);
        if (k >= 1) {
          st.phase = "open";
          st.t = 0;
          burst();
          st.flash = 1;
        }
      } else if (st.phase === "open") {
        st.t += dt;
        blob.position.y = 0;
        blob.scale.set(1, 1, 1);
        // couvercle s'ouvre
        const lo = Math.min(1, st.t / 0.5);
        lidPivot.rotation.x = -1.9 * (1 - Math.pow(1 - lo, 3));
        // gemme monte
        const go = Math.min(1, Math.max(0, (st.t - 0.15) / 0.6));
        gem.scale.setScalar(0.001 + go * 1.1 * (1 + Math.sin(tt * 4) * 0.04));
        gem.position.y = 1.0 + go * 0.9;
        halo.position.copy(gem.position);
        halo.material.opacity = go * 0.7;
        halo.scale.setScalar(0.6 + go * 1.3);
        innerMat.opacity = go * 0.85;
        chestGlow.intensity = go * 2.4;
        if (st.t > 0.9 && !st.opened) {
          st.opened = true;
          onOpenedRef.current?.();
        }
      }

      // bras selon la phase
      const baseZ = 0.35;
      if (st.phase === "walk") {
        const k = Math.min(1, st.t / 2.4);
        const swing = Math.sin(k * Math.PI * 14) * 0.9;
        armL.rotation.x = swing;
        armR.rotation.x = -swing;
        armL.rotation.z = -baseZ;
        armR.rotation.z = baseZ;
      } else if (st.phase === "open" || st.phase === "jump") {
        // bras en l'air : youpi !
        const wob = Math.sin(tt * 16) * 0.35;
        armL.rotation.z = -2.5 + wob;
        armR.rotation.z = 2.5 - wob;
        armL.rotation.x = 0;
        armR.rotation.x = 0;
      } else {
        armL.rotation.x += (0 - armL.rotation.x) * Math.min(1, dt * 6);
        armR.rotation.x += (0 - armR.rotation.x) * Math.min(1, dt * 6);
        armL.rotation.z = -baseZ + Math.sin(tt * 2) * 0.08;
        armR.rotation.z = baseZ - Math.sin(tt * 2) * 0.08;
      }

      // flash
      if (st.flash > 0) {
        st.flash = Math.max(0, st.flash - dt * 2.2);
        renderer.setClearColor(new THREE.Color(S.sparkle), st.flash * 0.5);
      } else {
        renderer.setClearColor(0x000000, 0);
      }

      // particules
      particles.forEach((p) => {
        if (p.life <= 0) return;
        p.vel.y -= dt * 7.5;
        p.m.position.addScaledVector(p.vel, dt);
        p.m.rotation.x += p.rot.x * dt;
        p.m.rotation.y += p.rot.y * dt;
        if (p.m.position.y < 0.05) {
          p.vel.y = Math.abs(p.vel.y) * 0.4;
          p.vel.multiplyScalar(0.7);
          p.m.position.y = 0.05;
        }
        p.life -= dt * 0.5;
        p.m.material.opacity = Math.max(0, p.life);
        if (p.life <= 0) p.m.visible = false;
      });

      // léger dolly caméra à l'ouverture
      const target = st.phase === "open" ? 7.2 : 8.2;
      camera.position.z += (target - camera.position.z) * Math.min(1, dt * 2);
      camera.position.y += (3.0 - camera.position.y) * Math.min(1, dt * 2);
      camera.lookAt(0, 1.1, 0);

      renderer.render(scene, camera);
    }
    frame();

    return () => {
      cancelAnimationFrame(st.raf);
      ro.disconnect();
      apiRef.current = null;
      renderer.dispose();
      scene.traverse((o) => {
        const obj = o as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // La scène est entièrement reconstruite quand ces tokens changent
    // (thème, couleur du blob, personnage, ou palier de coffre).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.id, ui.scene.blob, ui.scene.chestBody, hero]);

  // pilotage lecture / reset
  useEffect(() => {
    if (!apiRef.current) return;
    if (play) {
      apiRef.current.start(reduced);
    } else {
      apiRef.current.reset();
    }
  }, [play, reduced]);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
