"use client";

import React, { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Color } from "ogl";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { cn } from "@/lib/utils";

export interface ParticlesProps {
  particleColors?: string[];
  altColors?: string[];
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleBaseSize?: number;
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  disableRotation?: boolean;
  enableConnections?: boolean;
  pixelRatio?: number;
  className?: string;
  isOtherSide?: boolean;
}

const particleVertexShader = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random; // x: phase, y: speed, z: layer(0=bg, 1=mid, 2=fg), w: noise seed
  attribute vec3 color;
  attribute vec3 altColor;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uBaseSize;
  uniform vec2 uMouse;
  uniform float uHoverFactor;
  uniform float uDisableRotation;
  uniform vec3 uPulseCenter;
  uniform float uPulseStrength;
  uniform float uBurstProgress;
  uniform float uRealmTransition;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;

  void main() {
    float layer = random.z;
    vLayer = layer;

    // Smooth realm color transition
    vec3 baseCol = mix(color, altColor, uRealmTransition);
    vColor = baseCol;

    // Depth tier speed scaling (Background: slow drift, Foreground: lively)
    float depthSpeed = layer < 0.5 ? 0.4 : (layer < 1.5 ? 0.85 : 1.4);
    float t = uTime * uSpeed * depthSpeed * (0.7 + random.y * 0.6) + random.x * 6.28;

    vec3 pos = position;

    // Dimensional flow field: subtle directional drift
    float flowAngle = (uRealmTransition > 0.5)
      ? atan(pos.y, pos.x) + 0.4 * sin(t * 0.5)
      : 0.85; // 45 deg upward sanctuary drift

    pos.x += cos(flowAngle + random.w * 3.14) * (0.35 + 0.35 * layer);
    pos.y += sin(flowAngle + random.x * 3.14) * (0.35 + 0.35 * layer);
    pos.z += sin(t * 0.6 + random.y * 6.28) * (0.2 + 0.25 * layer);

    // Coordinate rotation around z and y axes
    if (uDisableRotation < 0.5) {
      float rotAngle = uTime * uSpeed * (0.06 + 0.04 * layer) * (uRealmTransition > 0.5 ? 1.4 : 1.0);
      float cosRot = cos(rotAngle);
      float sinRot = sin(rotAngle);
      float rx = pos.x * cosRot - pos.z * sinRot;
      float rz = pos.x * sinRot + pos.z * cosRot;
      pos.x = rx;
      pos.z = rz;
    }

    // Cursor Energy Field Repulsion & Excitation
    vec2 diff = pos.xy - uMouse;
    float dist = length(diff);
    float hoverRadius = layer > 1.5 ? 5.2 : (layer > 0.5 ? 3.8 : 2.2);
    float mouseInfluence = 0.0;
    if (dist < hoverRadius && uHoverFactor > 0.0) {
      float force = (1.0 - dist / hoverRadius) * uHoverFactor * (0.4 + 0.6 * (layer / 2.0));
      pos.xy += normalize(diff) * force;
      mouseInfluence = (1.0 - dist / hoverRadius);
    }

    // Anomaly Pulse Displacement
    if (uPulseStrength > 0.01) {
      vec3 pDiff = pos - uPulseCenter;
      float pDist = length(pDiff);
      if (pDist < 6.0) {
        float pFactor = (1.0 - pDist / 6.0) * uPulseStrength;
        pos += normalize(pDiff) * pFactor * 1.5;
        mouseInfluence += pFactor * 0.9;
      }
    }

    // World Inversion Dimensional Burst
    if (uBurstProgress > 0.0) {
      float burstWave = sin(uBurstProgress * 3.14159);
      pos += normalize(pos) * burstWave * 5.0;
    }

    vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size hierarchy by depth tier:
    // Layer 0: 70% Background Dust
    // Layer 1: 25% Mid-layer glowing particles
    // Layer 2: 5% Foreground Anomaly Orbs
    float layerSizeMultiplier = layer < 0.5 ? 0.65 : (layer < 1.5 ? 1.25 : 2.4);
    float pulse = 0.85 + 0.3 * sin(uTime * 2.8 + random.x * 12.0);

    gl_PointSize = (uBaseSize * layerSizeMultiplier * pulse * (1.0 + mouseInfluence * 0.6)) / (-mvPosition.z);

    // Alpha calculation: foreground and excited particles shine brightly
    float baseAlpha = layer < 0.5 ? 0.55 : (layer < 1.5 ? 0.85 : 1.0);
    vAlpha = clamp(baseAlpha * (0.65 + 0.35 * random.w) + mouseInfluence * 0.4, 0.0, 1.0);
  }
`;

const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) {
      discard;
    }

    // Two-stage radial emission: intense bright core + atmospheric outer halo
    float core = smoothstep(0.18, 0.0, dist);
    float halo = smoothstep(0.5, 0.05, dist);

    vec3 finalColor = vColor + vec3(core * 0.65);
    float finalAlpha = (halo * 0.7 + core * 0.45) * vAlpha;

    gl_FragColor = vec4(finalColor, finalAlpha * (uAlpha > 0.5 ? 1.0 : 0.9));
  }
`;

const lineVertexShader = /* glsl */ `
  attribute vec3 position;
  attribute float alpha;
  attribute vec3 color;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = alpha;
    vColor = color;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = /* glsl */ `
  precision highp float;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha * 0.25);
  }
`;

export function Particles({
  particleColors = ["#19D9FF", "#8BEAFF", "#FF2424", "#FFFFFF"],
  altColors = ["#FF1A24", "#DC2626", "#FF4D4D", "#FFFFFF"],
  particleCount,
  particleSpread = 11,
  speed = 0.09,
  particleBaseSize = 135,
  moveParticlesOnHover = true,
  particleHoverFactor = 0.85,
  alphaParticles = true,
  disableRotation = false,
  enableConnections = true,
  pixelRatio,
  className,
  isOtherSide = false,
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isTransitioning, transitionType } = useWorldTransition();

  // Keep ref to world transition status for animation loop
  const transitionRef = useRef({ isTransitioning, transitionType, isOtherSide });
  useEffect(() => {
    transitionRef.current = { isTransitioning, transitionType, isOtherSide };
  }, [isTransitioning, transitionType, isOtherSide]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let animationFrameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Detect user preferences and device capabilities
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isTouchDevice =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    // Responsive particle count if not explicitly passed
    let effectiveCount = particleCount;
    if (!effectiveCount) {
      if (typeof window !== "undefined") {
        const w = window.innerWidth;
        if (w < 768) effectiveCount = 130;
        else if (w < 1024) effectiveCount = 220;
        else effectiveCount = 320;
      } else {
        effectiveCount = 260;
      }
    }

    const effectiveSpeed = prefersReducedMotion ? 0.005 : speed;
    const effectiveHover = isTouchDevice || prefersReducedMotion ? 0 : particleHoverFactor;

    try {
      const dpr =
        pixelRatio ||
        (typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 1, 2)
          : 1);

      renderer = new Renderer({
        depth: false,
        alpha: true,
        antialias: false,
        dpr,
      });

      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);

      // Additive-friendly alpha blending for vibrant neon glow
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      renderer.gl.canvas.style.display = "block";
      renderer.gl.canvas.style.width = "100%";
      renderer.gl.canvas.style.height = "100%";
      container.appendChild(renderer.gl.canvas);

      const camera = new Camera(gl, { fov: 45 });
      camera.position.set(0, 0, 14);

      const count = Math.max(20, effectiveCount);
      const positions = new Float32Array(count * 3);
      const randoms = new Float32Array(count * 4);
      const colors = new Float32Array(count * 3);
      const altColorsArray = new Float32Array(count * 3);

      const parsedPrimary = particleColors.map((hex) => new Color(hex));
      const parsedAlt = altColors.map((hex) => new Color(hex));

      const spread = particleSpread;

      // 70% Background Dust (layer 0), 25% Mid Motes (layer 1), 5% Foreground Anomalies (layer 2)
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const i4 = i * 4;

        // Biased distribution: slightly denser around edges/corners, open in center
        const isEdge = Math.random() < 0.45;
        let x = (Math.random() - 0.5) * spread * 2.0;
        let y = (Math.random() - 0.5) * spread * 1.2;
        if (isEdge) {
          x = (Math.random() > 0.5 ? 1 : -1) * (spread * 0.65 + Math.random() * spread * 0.4);
          y = (Math.random() - 0.5) * spread * 1.3;
        }

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = (Math.random() - 0.5) * spread * 1.1;

        // Determine layer
        const layerRand = Math.random();
        const layer = layerRand < 0.7 ? 0.0 : (layerRand < 0.95 ? 1.0 : 2.0);

        randoms[i4] = Math.random();
        randoms[i4 + 1] = Math.random();
        randoms[i4 + 2] = layer;
        randoms[i4 + 3] = Math.random();

        // Primary color
        const col = parsedPrimary[i % parsedPrimary.length];
        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;

        // Alternate realm color
        const aCol = parsedAlt[i % parsedAlt.length];
        altColorsArray[i3] = aCol.r;
        altColorsArray[i3 + 1] = aCol.g;
        altColorsArray[i3 + 2] = aCol.b;
      }

      const particleGeometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        random: { size: 4, data: randoms },
        color: { size: 3, data: colors },
        altColor: { size: 3, data: altColorsArray },
      });

      const particleProgram = new Program(gl, {
        vertex: particleVertexShader,
        fragment: particleFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: effectiveSpeed },
          uBaseSize: { value: particleBaseSize * dpr },
          uMouse: { value: [0, 0] },
          uHoverFactor: { value: effectiveHover },
          uDisableRotation: { value: disableRotation ? 1.0 : 0.0 },
          uAlpha: { value: alphaParticles ? 1.0 : 0.0 },
          uPulseCenter: { value: [0, 0, 0] },
          uPulseStrength: { value: 0 },
          uBurstProgress: { value: 0 },
          uRealmTransition: { value: isOtherSide ? 1.0 : 0.0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const particleMesh = new Mesh(gl, {
        mode: gl.POINTS,
        geometry: particleGeometry,
        program: particleProgram,
      });

      // Optional Line Connections (Signal Synapses)
      const maxLines = 80;
      const linePositions = new Float32Array(maxLines * 6);
      const lineAlphas = new Float32Array(maxLines * 2);
      const lineColors = new Float32Array(maxLines * 6);

      const lineGeometry = new Geometry(gl, {
        position: { size: 3, data: linePositions },
        alpha: { size: 1, data: lineAlphas },
        color: { size: 3, data: lineColors },
      });

      const lineProgram = new Program(gl, {
        vertex: lineVertexShader,
        fragment: lineFragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const lineMesh = new Mesh(gl, {
        mode: gl.LINES,
        geometry: lineGeometry,
        program: lineProgram,
      });

      const targetMouse = { x: 0, y: 0 };
      const currentMouse = { x: 0, y: 0 };

      // Anomaly Pulse State
      let nextPulseTime = performance.now() + 3000 + Math.random() * 4000;
      let pulseStartTime = 0;
      let pulseCenter = [0, 0, 0];

      // Resize handler
      const handleResize = () => {
        if (!container || !renderer) return;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        renderer.setSize(width, height);
        camera.perspective({ aspect: width / Math.max(1, height) });
      };

      handleResize();
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Pointer tracking
      const handlePointerMove = (e: MouseEvent | PointerEvent) => {
        if (!moveParticlesOnHover || effectiveHover === 0 || !container) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetMouse.x = x * (spread * 0.7);
        targetMouse.y = y * (spread * 0.45);
      };

      if (moveParticlesOnHover && effectiveHover > 0) {
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
      }

      // Main Render Loop
      const startTime = performance.now();
      let burstStart = 0;
      let currentRealmTransition = isOtherSide ? 1.0 : 0.0;

      const render = (now: number) => {
        const elapsed = (now - startTime) * 0.001;
        particleProgram.uniforms.uTime.value = elapsed;

        // Smooth mouse easing
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;
        particleProgram.uniforms.uMouse.value[0] = currentMouse.x;
        particleProgram.uniforms.uMouse.value[1] = currentMouse.y;

        // Handle Random Anomaly Pulses
        if (now > nextPulseTime && pulseStartTime === 0 && !prefersReducedMotion) {
          pulseStartTime = now;
          pulseCenter = [
            (Math.random() - 0.5) * spread * 1.2,
            (Math.random() - 0.5) * spread * 0.8,
            (Math.random() - 0.5) * spread * 0.5,
          ];
          particleProgram.uniforms.uPulseCenter.value = pulseCenter;
        }

        if (pulseStartTime > 0) {
          const pulseElapsed = (now - pulseStartTime) * 0.001;
          const pulseDuration = 1.4;
          if (pulseElapsed < pulseDuration) {
            const pStrength = Math.sin((pulseElapsed / pulseDuration) * 3.14159);
            particleProgram.uniforms.uPulseStrength.value = pStrength;
          } else {
            particleProgram.uniforms.uPulseStrength.value = 0;
            pulseStartTime = 0;
            nextPulseTime = now + 4000 + Math.random() * 5000;
          }
        }

        // Handle World Transition Dimensional Burst
        const { isTransitioning: transActive, transitionType: transType } = transitionRef.current;
        if (transActive && burstStart === 0) {
          burstStart = now;
        } else if (!transActive) {
          burstStart = 0;
        }

        if (burstStart > 0) {
          const bElapsed = (now - burstStart) * 0.001;
          const bDuration = 1.2;
          if (bElapsed < bDuration) {
            particleProgram.uniforms.uBurstProgress.value = bElapsed / bDuration;
          } else {
            particleProgram.uniforms.uBurstProgress.value = 0;
          }
        }

        // Smooth realm color transition
        const targetRealm = (transActive && transType !== "other-to-right") || transitionRef.current.isOtherSide ? 1.0 : 0.0;
        currentRealmTransition += (targetRealm - currentRealmTransition) * 0.04;
        particleProgram.uniforms.uRealmTransition.value = currentRealmTransition;

        // Render particles
        renderer?.render({ scene: particleMesh, camera });

        // Update Dynamic Signal Lines (connections between close mid/foreground motes)
        if (enableConnections && !prefersReducedMotion && count <= 350) {
          let lineIdx = 0;
          const maxDist = 2.0;
          const maxDistSq = maxDist * maxDist;

          // Check subset of active particles for performance
          const step = count > 200 ? 2 : 1;
          for (let i = 0; i < count && lineIdx < maxLines; i += step) {
            const lA = randoms[i * 4 + 2];
            if (lA < 0.5) continue; // Skip background dust

            const xA = positions[i * 3];
            const yA = positions[i * 3 + 1];
            const zA = positions[i * 3 + 2];

            for (let j = i + step; j < count && lineIdx < maxLines; j += step) {
              const lB = randoms[j * 4 + 2];
              if (lB < 0.5) continue;

              const dx = positions[j * 3] - xA;
              const dy = positions[j * 3 + 1] - yA;
              const dz = positions[j * 3 + 2] - zA;
              const distSq = dx * dx + dy * dy + dz * dz;

              if (distSq < maxDistSq) {
                const dist = Math.sqrt(distSq);
                const lAlpha = (1.0 - dist / maxDist) * 0.6;
                const offset = lineIdx * 6;
                const aOffset = lineIdx * 2;

                linePositions[offset] = xA;
                linePositions[offset + 1] = yA;
                linePositions[offset + 2] = zA;
                linePositions[offset + 3] = positions[j * 3];
                linePositions[offset + 4] = positions[j * 3 + 1];
                linePositions[offset + 5] = positions[j * 3 + 2];

                lineAlphas[aOffset] = lAlpha;
                lineAlphas[aOffset + 1] = lAlpha;

                // Color lines matching realm
                const rCol = currentRealmTransition > 0.5 ? [1.0, 0.2, 0.2] : [0.1, 0.85, 1.0];
                lineColors[offset] = rCol[0];
                lineColors[offset + 1] = rCol[1];
                lineColors[offset + 2] = rCol[2];
                lineColors[offset + 3] = rCol[0];
                lineColors[offset + 4] = rCol[1];
                lineColors[offset + 5] = rCol[2];

                lineIdx++;
              }
            }
          }

          // Zero out remaining line buffer
          for (let k = lineIdx * 2; k < maxLines * 2; k++) {
            lineAlphas[k] = 0;
          }

          lineGeometry.attributes.position.data = linePositions;
          lineGeometry.attributes.position.needsUpdate = true;
          lineGeometry.attributes.alpha.data = lineAlphas;
          lineGeometry.attributes.alpha.needsUpdate = true;
          lineGeometry.attributes.color.data = lineColors;
          lineGeometry.attributes.color.needsUpdate = true;

          renderer?.render({ scene: lineMesh, camera });
        }

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        if (moveParticlesOnHover) {
          window.removeEventListener("pointermove", handlePointerMove);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (renderer && renderer.gl.canvas.parentElement) {
          renderer.gl.canvas.parentElement.removeChild(renderer.gl.canvas);
        }
        try {
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {
          // Ignore context loss errors
        }
      };
    } catch (err) {
      console.warn("WebGL initialization failed for Particles component:", err);
    }
  }, [
    particleColors,
    altColors,
    particleCount,
    particleSpread,
    speed,
    particleBaseSize,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    disableRotation,
    enableConnections,
    pixelRatio,
    isOtherSide,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden select-none",
        className
      )}
    />
  );
}
