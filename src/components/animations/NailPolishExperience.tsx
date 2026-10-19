"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import anime from "animejs";
import styles from "./NailPolishExperience.module.css";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function NailPolishExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8);

    scene.add(new THREE.HemisphereLight(0xfff2f3, 0x6b2639, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-3, 4, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xf58eaa, 16, 12);
    rimLight.position.set(3, 1, 3);
    scene.add(rimLight);

    const bottle = new THREE.Group();
    scene.add(bottle);
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xb81e45, metalness: 0.08, roughness: 0.18, transmission: 0.12,
      thickness: 0.6, clearcoat: 1, clearcoatRoughness: 0.12,
    });
    const bottleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.72, 1.9, 48, 1), glass);
    bottleBody.position.y = -0.42;
    bottle.add(bottleBody);
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.82, 0.42, 48), glass);
    shoulder.position.y = 0.72;
    bottle.add(shoulder);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.35, 40), glass);
    neck.position.y = 1.08;
    bottle.add(neck);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0x39242b, roughness: 0.25, metalness: 0.35 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.95, 40), capMaterial);
    cap.position.y = 1.72;
    bottle.add(cap);
    const capBand = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.09, 40), new THREE.MeshStandardMaterial({ color: 0xe6c5c5, metalness: 0.75, roughness: 0.22 }));
    capBand.position.y = 1.3;
    bottle.add(capBand);

    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.55), new THREE.MeshBasicMaterial({ color: 0xffe9eb }));
    label.position.set(0, -0.45, 0.79);
    bottle.add(label);

    const brush = new THREE.Group();
    scene.add(brush);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.5, 16), capMaterial);
    handle.position.y = 0.8;
    brush.add(handle);
    const bristles = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 0.42, 20), new THREE.MeshStandardMaterial({ color: 0xa90f35, roughness: 0.45 }));
    bristles.position.y = -0.15;
    brush.add(bristles);
    brush.visible = false;

    const nail = new THREE.Group();
    scene.add(nail);
    const nailMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf4b4bd, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });
    const nailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.3, 8, 24), nailMaterial);
    nailBase.scale.set(0.72, 1, 0.22);
    nailBase.rotation.z = -0.28;
    nail.add(nailBase);
    const polish = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.23, 8, 24), new THREE.MeshPhysicalMaterial({ color: 0xb51e42, roughness: 0.2, clearcoat: 1 }));
    polish.scale.set(0.72, 1, 0.23);
    polish.rotation.z = -0.28;
    polish.position.z = 0.025;
    nail.add(polish);
    nail.visible = false;
    nail.position.set(1.2, -0.1, 0);

    const resize = () => {
      const width = Math.max(1, section.clientWidth);
      const height = Math.max(1, section.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 600 ? 9.2 : 8;
      camera.updateProjectionMatrix();
    };

    const phraseAnimations = phraseRefs.current.map((element) => element ? anime({
      targets: element, opacity: [0, 1], translateY: [18, 0], duration: 1, autoplay: false, easing: "linear",
    }) : null);

    const update = () => {
      const rect = section.getBoundingClientRect();
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / range);
      if (!reducedMotion) {
        bottle.rotation.y = progress * 1.1;
        bottle.rotation.z = Math.sin(progress * Math.PI) * 0.08;
        bottle.position.y = progress < 0.48 ? progress * 0.6 : 0.28 - (progress - 0.48) * 0.45;
        bottle.scale.setScalar(progress > 0.72 ? 1 - (progress - 0.72) * 1.2 : 1);
        cap.position.y = 1.72 + (progress > 0.18 ? Math.min(0.9, (progress - 0.18) * 2.5) : 0);
        brush.visible = progress > 0.22 && progress < 0.94;
        brush.position.set(0.25 + Math.sin(progress * Math.PI * 5) * 0.65, 1.5 - progress * 3.5, 0.5);
        brush.rotation.z = Math.sin(progress * Math.PI * 5) * 0.5;
        nail.visible = progress > 0.64;
        nail.rotation.z = progress > 0.64 ? (progress - 0.64) * 0.7 : 0;
        nail.scale.setScalar(progress > 0.64 ? 0.8 + Math.min(0.3, (progress - 0.64) * 0.7) : 0.8);
      }
      phraseAnimations.forEach((animation, index) => {
        if (!animation) return;
        const start = 0.12 + index * 0.24;
        animation.seek(clamp((progress - start) / 0.18) * animation.duration);
        const element = phraseRefs.current[index];
        if (element) element.style.opacity = String(clamp((progress - start) / 0.1) * clamp((start + 0.23 - progress) / 0.1));
      });
      if (bottleRef.current) bottleRef.current.style.opacity = String(progress > 0.82 ? clamp((0.98 - progress) / 0.16) : 1);
      renderer.render(scene, camera);
    };

    const onScroll = () => update();
    const observer = new ResizeObserver(() => { resize(); update(); });
    observer.observe(section);
    resize();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    const entrance = anime({ targets: bottleRef.current, opacity: [0, 1], translateY: [22, 0], duration: reducedMotion ? 0 : 900, easing: "easeOutCubic" });
    return () => {
      entrance.pause();
      phraseAnimations.forEach((animation) => animation?.pause());
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.experience} aria-label="Experiência visual de esmaltação">
      <div className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div ref={bottleRef} className={styles.intro}>
          <span className={styles.kicker}>NAILS BY SAMARA · AUTOCUIDADO</span>
          <p>Um toque de cor.<br /><em>Um momento seu.</em></p>
          <span className={styles.scrollHint}>CONTINUE DESCENDO <span aria-hidden="true">↓</span></span>
        </div>
        <div className={styles.phrases} aria-live="polite">
          <p ref={(node) => { phraseRefs.current[0] = node; }}>Delicada.</p>
          <p ref={(node) => { phraseRefs.current[1] = node; }}>Bem cuidada.</p>
          <p ref={(node) => { phraseRefs.current[2] = node; }}>Elegante.</p>
        </div>
        <div className={styles.progress} aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
