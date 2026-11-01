/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PirinolaOption } from '../types/pirinola';
import { playTick, playWobbleThud } from '../utils/audio';

interface PirinolaCanvasProps {
  options: PirinolaOption[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (result: PirinolaOption) => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

/**
 * Splits text into wrapped lines that fit within maxWidth on a canvas context
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  const clean = text.trim();
  const words = clean.split(/\s+/);
  if (words.length <= 1) return [clean];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        const remaining = words.slice(i).join(' ');
        lines.push(remaining);
        return lines;
      }
    }
  }

  lines.push(currentLine);
  return lines;
}

export const PirinolaCanvas: React.FC<PirinolaCanvasProps> = ({
  options,
  isSpinning,
  onSpinStart,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Physics simulation state refs to maintain 60fps loop
  const stateRef = useRef({
    spinAngle: 0,
    angularVelocity: 0,
    wobblePhase: 0,
    wobbleAmount: 0, // In radians
    precessionAngle: 0,
    isSpinning: false,
    restingFaceIndex: 0,
    targetFaceIndex: 0,
    settling: false,
    lastTickAngle: 0,
    wobbleThudPlayed: false,
  });

  // Pointer drag interaction
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    vx: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    vx: 0,
  });

  const [power, setPower] = useState(0.8);

  const activeOptions = options.filter((o) => o.enabled);
  const numFaces = Math.max(3, activeOptions.length);

  // Trigger spin with specified initial velocity
  const startSpinWithVelocity = useCallback(
    (initialVelocity: number) => {
      if (stateRef.current.isSpinning) return;

      onSpinStart();

      // Pick a random target face
      const chosenIndex = Math.floor(Math.random() * numFaces);
      
      const st = stateRef.current;
      st.isSpinning = true;
      st.settling = false;
      st.wobbleThudPlayed = false;
      st.targetFaceIndex = chosenIndex;
      st.angularVelocity = Math.max(26, Math.min(initialVelocity, 48));
      st.wobbleAmount = 0.05;
      st.lastTickAngle = st.spinAngle;
    },
    [numFaces, onSpinStart]
  );

  // Expose spin action for parent
  useEffect(() => {
    if (isSpinning && !stateRef.current.isSpinning) {
      const baseVel = 30 + power * 15 + (Math.random() * 5 - 2.5);
      startSpinWithVelocity(baseVel);
    }
  }, [isSpinning, power, startSpinWithVelocity]);

  // Pointer handlers for direct flick/spin on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.isSpinning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      vx: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging || stateRef.current.isSpinning) return;

    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTime);
    const dx = e.clientX - drag.lastX;

    drag.vx = (dx / dt) * 1000; // pixels per second
    drag.lastX = e.clientX;
    drag.lastTime = now;

    // Direct manual nudge
    stateRef.current.spinAngle += (dx * 0.02);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;
    drag.isDragging = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const totalDx = e.clientX - drag.startX;
    const speed = Math.abs(drag.vx);

    if (speed > 250 || Math.abs(totalDx) > 30) {
      // Swiped!
      const dir = totalDx < 0 ? -1 : 1;
      const calculatedVel = Math.min(46, Math.max(24, (speed / 70) * (dir === -1 ? -1 : 1)));
      startSpinWithVelocity(Math.abs(calculatedVel));
    }
  };

  // Main 3D Render & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3D Geometry Constants
    const R = 88; // Central prism radius
    const H_BODY = 96; // Prism height
    const H_CAP = 38; // Chamfer cone
    const H_STEM = 64; // Handle stem height
    const R_STEM = 14; // Handle radius
    const H_TIP = 82; // Bottom point cone
    const CAMERA_DIST = 680;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const st = stateRef.current;

      // Handle Resize / High DPI
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2 - 15;

      // Physics update
      if (st.isSpinning) {
        // Rotational friction
        st.angularVelocity *= Math.pow(0.978, dt * 60);
        st.spinAngle += st.angularVelocity * dt;

        // Sound clicks for each face passing by
        const angleDiff = Math.abs(st.spinAngle - st.lastTickAngle);
        const faceStep = (Math.PI * 2) / numFaces;
        if (angleDiff >= faceStep) {
          st.lastTickAngle = st.spinAngle;
          playTick(Math.min(1.6, Math.max(0.7, st.angularVelocity / 20)));
        }

        // Wobble physics as top loses rotational momentum
        if (st.angularVelocity < 16) {
          const wobbleIntensity = (16 - st.angularVelocity) / 16;
          st.wobblePhase += dt * 14;
          st.precessionAngle += dt * 7;
          st.wobbleAmount = Math.min(0.85, 0.08 + wobbleIntensity * 0.82);

          if (st.angularVelocity < 5 && !st.wobbleThudPlayed) {
            st.wobbleThudPlayed = true;
            playWobbleThud();
          }
        } else {
          // Subtle high-speed spin precession
          st.wobbleAmount = 0.03 + Math.sin(now * 0.015) * 0.015;
          st.precessionAngle += dt * 3;
        }

        // Settling to rest
        if (st.angularVelocity < 0.6) {
          st.angularVelocity = 0;
          st.isSpinning = false;
          st.settling = true;

          // Align to facing side
          const normalized = ((st.spinAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const faceStep = (Math.PI * 2) / numFaces;
          
          // Face that faces forward (camera at z < 0, looking +z)
          const winningIndex = Math.floor(((Math.PI * 2 - normalized + faceStep / 2) % (Math.PI * 2)) / faceStep) % numFaces;
          st.restingFaceIndex = winningIndex;

          const chosen = activeOptions[winningIndex] || activeOptions[0];
          onSpinEnd(chosen);
        }
      } else {
        // Idle gentle float or resting settle
        if (!st.settling) {
          st.wobbleAmount = 0.42;
          st.wobblePhase = 0;
          st.precessionAngle = 0.3;
        }
      }

      // 3D Transformations
      // Compute 3D rotation matrix combining wobble (nutation + precession) and spin
      const cosP = Math.cos(st.precessionAngle);
      const sinP = Math.sin(st.precessionAngle);
      const cosW = Math.cos(st.wobbleAmount);
      const sinW = Math.sin(st.wobbleAmount);
      const cosS = Math.cos(st.spinAngle);
      const sinS = Math.sin(st.spinAngle);

      // Rotate point P through spin around Y, then tilt by wobbleAmount around axis at precessionAngle
      const transformPoint = (p: Point3D): Point3D => {
        // 1. Spin around Y-axis
        const x1 = p.x * cosS + p.z * sinS;
        const y1 = p.y;
        const z1 = -p.x * sinS + p.z * cosS;

        // 2. Precession alignment: rotate around Y by -precessionAngle
        const x2 = x1 * cosP - z1 * sinP;
        const y2 = y1;
        const z2 = x1 * sinP + z1 * cosP;

        // 3. Nutation tilt: tilt around X-axis by wobbleAmount
        const x3 = x2;
        const y3 = y2 * cosW - z2 * sinW;
        const z3 = y2 * sinW + z2 * cosW;

        // 4. Precession restore: rotate around Y by +precessionAngle
        const x4 = x3 * cosP + z3 * sinP;
        const y4 = y3;
        const z4 = -x3 * sinP + z3 * cosP;

        return { x: x4, y: y4, z: z4 };
      };

      // Project 3D point to 2D Screen
      const project = (p: Point3D): ProjectedPoint => {
        const tp = transformPoint(p);
        const scale = CAMERA_DIST / (CAMERA_DIST + tp.z);
        return {
          x: centerX + tp.x * scale,
          y: centerY + tp.y * scale,
          depth: tp.z,
        };
      };

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Table Surface Ring & Ambient Glow
      const tableCenterY = centerY + H_BODY / 2 + H_TIP - 10;
      const gradientTable = ctx.createRadialGradient(
        centerX,
        tableCenterY,
        20,
        centerX,
        tableCenterY,
        190
      );
      gradientTable.addColorStop(0, 'rgba(217, 119, 6, 0.12)'); // Amber warm glow
      gradientTable.addColorStop(0.5, 'rgba(30, 41, 59, 0.6)');
      gradientTable.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.fillStyle = gradientTable;
      ctx.beginPath();
      ctx.ellipse(centerX, tableCenterY + 12, 175, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Table Felt ring marker
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(centerX, tableCenterY + 12, 140, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Dynamic Shadow of the Pirinola on the Table
      const shadowTiltX = sinP * Math.sin(st.wobbleAmount) * 35;
      const shadowTiltY = cosP * Math.sin(st.wobbleAmount) * 15;
      const shadowScale = Math.max(0.6, 1 - st.wobbleAmount * 0.3);

      ctx.save();
      ctx.translate(centerX + shadowTiltX, tableCenterY + 14 + shadowTiltY);
      ctx.scale(shadowScale, shadowScale * 0.28);
      const shadowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 95);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Compute Geometry Polygons for Z-Sorting
      interface FacePolygon {
        type: 'prism' | 'bottomCone' | 'topCap' | 'stem' | 'tip';
        points: ProjectedPoint[];
        raw3D: Point3D[];
        faceIndex?: number;
        avgZ: number;
        normalZ: number;
        color: string;
        option?: PirinolaOption;
      }

      const polygons: FacePolygon[] = [];

      // Calculate base vertices in unrotated object space
      // Origin (0,0,0) is center of prism
      const topRimY = -H_BODY / 2;
      const btmRimY = H_BODY / 2;
      const capApexY = topRimY - H_CAP;
      const stemApexY = capApexY - H_STEM;
      const tipPointY = btmRimY + H_TIP;

      const topRim3D: Point3D[] = [];
      const btmRim3D: Point3D[] = [];

      for (let i = 0; i < numFaces; i++) {
        const theta = (i * 2 * Math.PI) / numFaces;
        topRim3D.push({ x: R * Math.sin(theta), y: topRimY, z: R * Math.cos(theta) });
        btmRim3D.push({ x: R * Math.sin(theta), y: btmRimY, z: R * Math.cos(theta) });
      }

      // A. Prism Faces
      for (let i = 0; i < numFaces; i++) {
        const next = (i + 1) % numFaces;
        const p0 = topRim3D[i];
        const p1 = topRim3D[next];
        const p2 = btmRim3D[next];
        const p3 = btmRim3D[i];

        const tp0 = transformPoint(p0);
        const tp1 = transformPoint(p1);
        const tp2 = transformPoint(p2);
        const tp3 = transformPoint(p3);

        // Face Normal (cross product to check visibility and lighting)
        const ux = tp1.x - tp0.x;
        const uy = tp1.y - tp0.y;
        const uz = tp1.z - tp0.z;
        const vx = tp3.x - tp0.x;
        const vy = tp3.y - tp0.y;
        const vz = tp3.z - tp0.z;

        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;

        const avgZ = (tp0.z + tp1.z + tp2.z + tp3.z) / 4;
        const opt = activeOptions[i] || activeOptions[0];

        polygons.push({
          type: 'prism',
          points: [project(p0), project(p1), project(p2), project(p3)],
          raw3D: [tp0, tp1, tp2, tp3],
          faceIndex: i,
          avgZ,
          normalZ: nz,
          color: opt.color,
          option: opt,
        });
      }

      // B. Bottom Cone Triangles (connecting btmRim to tip)
      const tip3D: Point3D = { x: 0, y: tipPointY, z: 0 };
      for (let i = 0; i < numFaces; i++) {
        const next = (i + 1) % numFaces;
        const p0 = btmRim3D[i];
        const p1 = btmRim3D[next];
        const p2 = tip3D;

        const tp0 = transformPoint(p0);
        const tp1 = transformPoint(p1);
        const tp2 = transformPoint(p2);

        const avgZ = (tp0.z + tp1.z + tp2.z) / 3;
        polygons.push({
          type: 'bottomCone',
          points: [project(p0), project(p1), project(p2)],
          raw3D: [tp0, tp1, tp2],
          avgZ,
          normalZ: (tp1.x - tp0.x) * (tp2.y - tp0.y) - (tp1.y - tp0.y) * (tp2.x - tp0.x),
          color: '#B45309', // Warm carved wood
        });
      }

      // C. Upper Cap Triangles (connecting topRim to neck)
      const capCenter3D: Point3D = { x: 0, y: capApexY, z: 0 };
      for (let i = 0; i < numFaces; i++) {
        const next = (i + 1) % numFaces;
        const p0 = topRim3D[i];
        const p1 = topRim3D[next];
        const p2 = capCenter3D;

        const tp0 = transformPoint(p0);
        const tp1 = transformPoint(p1);
        const tp2 = transformPoint(p2);

        const avgZ = (tp0.z + tp1.z + tp2.z) / 3;
        polygons.push({
          type: 'topCap',
          points: [project(p0), project(p1), project(p2)],
          raw3D: [tp0, tp1, tp2],
          avgZ,
          normalZ: (tp1.x - tp0.x) * (tp2.y - tp0.y) - (tp1.y - tp0.y) * (tp2.x - tp0.x),
          color: '#78350F', // Dark mahogany wood
        });
      }

      // D. Stem Handle Cylinder segments
      const stemSegments = 8;
      for (let i = 0; i < stemSegments; i++) {
        const t1 = (i * 2 * Math.PI) / stemSegments;
        const t2 = ((i + 1) * 2 * Math.PI) / stemSegments;
        const sP0: Point3D = { x: R_STEM * Math.sin(t1), y: capApexY, z: R_STEM * Math.cos(t1) };
        const sP1: Point3D = { x: R_STEM * Math.sin(t2), y: capApexY, z: R_STEM * Math.cos(t2) };
        const sP2: Point3D = { x: (R_STEM * 0.8) * Math.sin(t2), y: stemApexY, z: (R_STEM * 0.8) * Math.cos(t2) };
        const sP3: Point3D = { x: (R_STEM * 0.8) * Math.sin(t1), y: stemApexY, z: (R_STEM * 0.8) * Math.cos(t1) };

        const tp0 = transformPoint(sP0);
        const tp1 = transformPoint(sP1);
        const tp2 = transformPoint(sP2);
        const tp3 = transformPoint(sP3);

        const avgZ = (tp0.z + tp1.z + tp2.z + tp3.z) / 4;
        polygons.push({
          type: 'stem',
          points: [project(sP0), project(sP1), project(sP2), project(sP3)],
          raw3D: [tp0, tp1, tp2, tp3],
          avgZ,
          normalZ: (tp1.x - tp0.x) * (tp2.y - tp0.y) - (tp1.y - tp0.y) * (tp2.x - tp0.x),
          color: '#D97706', // Gold/amber handle
        });
      }

      // Z-Sort: back to front (highest z drawn first)
      polygons.sort((a, b) => b.avgZ - a.avgZ);

      // Light direction vector: from top-left-front
      const lightDir = { x: -0.4, y: -0.8, z: -0.45 };
      const lightMag = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
      lightDir.x /= lightMag;
      lightDir.y /= lightMag;
      lightDir.z /= lightMag;

      // Render Polygons
      for (const poly of polygons) {
        if (poly.points.length < 3) continue;

        ctx.beginPath();
        ctx.moveTo(poly.points[0].x, poly.points[0].y);
        for (let j = 1; j < poly.points.length; j++) {
          ctx.lineTo(poly.points[j].x, poly.points[j].y);
        }
        ctx.closePath();

        // Calculate face normal in 3D
        const p0 = poly.raw3D[0];
        const p1 = poly.raw3D[1];
        const p2 = poly.raw3D[2];
        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v1z = p1.z - p0.z;
        const v2x = p2.x - p0.x;
        const v2y = p2.y - p0.y;
        const v2z = p2.z - p0.z;

        const nx = v1y * v2z - v1z * v2y;
        const ny = v1z * v2x - v1x * v2z;
        const nz = v1x * v2y - v1y * v2x;
        const nMag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const norm = { x: nx / nMag, y: ny / nMag, z: nz / nMag };

        // Diffuse lighting
        const dot = -(norm.x * lightDir.x + norm.y * lightDir.y + norm.z * lightDir.z);
        const brightness = Math.max(0.3, Math.min(1.2, 0.45 + dot * 0.7));

        if (poly.type === 'prism') {
          // Front-facing face rendering
          const baseColor = poly.color;
          ctx.fillStyle = baseColor;
          ctx.fill();

          // Lighting overlay
          ctx.fillStyle = brightness > 0.8
            ? `rgba(255, 255, 255, ${(brightness - 0.8) * 0.5})`
            : `rgba(0, 0, 0, ${(0.8 - brightness) * 0.6})`;
          ctx.fill();

          // Wooden bevel border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Top and bottom decorative Mexican gold stripes
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Render Text & Icon on visible prism faces
          // Only render text if the face is facing somewhat toward the camera (norm.z < 0.1)
          if (norm.z < 0.1 && poly.option) {
            // Face orientation vector
            const dx = poly.points[1].x - poly.points[0].x;
            const dy = poly.points[1].y - poly.points[0].y;
            const faceWidth = Math.sqrt(dx * dx + dy * dy);

            if (faceWidth > 18) {
              ctx.save();

              // Center of face
              const midX = (poly.points[0].x + poly.points[1].x + poly.points[2].x + poly.points[3].x) / 4;
              const midY = (poly.points[0].y + poly.points[1].y + poly.points[2].y + poly.points[3].y) / 4;
              const faceAngle = Math.atan2(dy, dx);

              const vdx = poly.points[3].x - poly.points[0].x;
              const vdy = poly.points[3].y - poly.points[0].y;
              const faceHeight = Math.sqrt(vdx * vdx + vdy * vdy);

              ctx.translate(midX, midY);
              ctx.rotate(faceAngle);

            // Available bounding dimensions for text on this facet
            const maxAllowedWidth = Math.max(26, faceWidth * 0.84);
            const hasDrinks = poly.option.drinks > 0;
            const maxAllowedHeight = Math.max(26, faceHeight * (hasDrinks ? 0.62 : 0.74));

            // Use full text for wrapped multiline display, with fallback to shortText
            const rawText = poly.option.text || poly.option.shortText;

            // Dynamic font sizing & text wrapping loop to fit facet perfectly
            let optimalSize = Math.min(13, Math.max(7.5, Math.round(faceWidth * 0.22)));
            let wrappedLines: string[] = [];
            let lineHeight = optimalSize * 1.15;

            // Try decreasing font size until wrapped lines fit both width and height constraints
            for (let s = optimalSize; s >= 6.5; s -= 0.5) {
              ctx.font = `800 ${s}px "Outfit", sans-serif`;
              wrappedLines = wrapCanvasText(ctx, rawText, maxAllowedWidth, 3);
              lineHeight = s * 1.16;
              const totalBlockHeight = wrappedLines.length * lineHeight;

              const widestLine = wrappedLines.reduce(
                (max, l) => Math.max(max, ctx.measureText(l).width),
                0
              );

              if (widestLine <= maxAllowedWidth && totalBlockHeight <= maxAllowedHeight) {
                optimalSize = s;
                break;
              }
              optimalSize = s;
            }

            ctx.font = `800 ${optimalSize}px "Outfit", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // High contrast text shadow for 3D visibility against face color
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillStyle = '#FFFFFF';

            // Compute centered Y offset for all lines
            const totalHeight = (wrappedLines.length - 1) * lineHeight;
            const startY = hasDrinks ? -totalHeight / 2 - 4 : -totalHeight / 2;

            wrappedLines.forEach((line, lineIdx) => {
              ctx.fillText(line, 0, startY + lineIdx * lineHeight);
            });

            // Small sub-label or drinks count if applicable
            if (hasDrinks) {
              const drinksFontSize = Math.max(7, Math.min(9.5, optimalSize * 0.88));
              ctx.font = `700 ${drinksFontSize}px "Plus Jakarta Sans", sans-serif`;
              ctx.fillStyle = '#FDE047'; // Bright yellow
              const drinksY = startY + (wrappedLines.length - 1) * lineHeight + lineHeight * 0.9 + 2;
              ctx.fillText(`${poly.option.drinks} 🥃`, 0, drinksY);
            }

            ctx.restore();
            }
          }
        } else if (poly.type === 'bottomCone') {
          // Bottom cone wood texture with carved rings
          ctx.fillStyle = poly.color;
          ctx.fill();

          ctx.fillStyle = brightness > 0.8
            ? `rgba(255, 255, 255, ${(brightness - 0.8) * 0.4})`
            : `rgba(0, 0, 0, ${(0.8 - brightness) * 0.65})`;
          ctx.fill();

          ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (poly.type === 'topCap') {
          // Upper cap
          ctx.fillStyle = poly.color;
          ctx.fill();

          ctx.fillStyle = brightness > 0.8
            ? `rgba(255, 255, 255, ${(brightness - 0.8) * 0.5})`
            : `rgba(0, 0, 0, ${(0.8 - brightness) * 0.6})`;
          ctx.fill();

          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (poly.type === 'stem') {
          // Handle stem
          ctx.fillStyle = poly.color;
          ctx.fill();

          ctx.fillStyle = brightness > 0.8
            ? `rgba(255, 255, 255, ${(brightness - 0.8) * 0.6})`
            : `rgba(0, 0, 0, ${(0.8 - brightness) * 0.5})`;
          ctx.fill();

          ctx.strokeStyle = 'rgba(180, 83, 9, 0.5)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Draw Top Knob Sphere on Handle
      const stemTopPoint: Point3D = { x: 0, y: stemApexY - 4, z: 0 };
      const projStemTop = project(stemTopPoint);
      const knobGrad = ctx.createRadialGradient(
        projStemTop.x - 4,
        projStemTop.y - 4,
        2,
        projStemTop.x,
        projStemTop.y,
        14
      );
      knobGrad.addColorStop(0, '#FEF08A');
      knobGrad.addColorStop(0.5, '#F59E0B');
      knobGrad.addColorStop(1, '#92400E');

      ctx.fillStyle = knobGrad;
      ctx.beginPath();
      ctx.arc(projStemTop.x, projStemTop.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw tip metallic pin at bottom
      const tipPointProj = project(tip3D);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(tipPointProj.x, tipPointProj.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pointer / Arrow indicator at the table front showing where the winning face lands
      const indicatorY = tableCenterY + 28;
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(centerX, indicatorY - 8);
      ctx.lineTo(centerX - 8, indicatorY + 4);
      ctx.lineTo(centerX + 8, indicatorY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeOptions, numFaces, onSpinEnd]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      {/* 3D Canvas Container */}
      <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[420px] rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center select-none touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          title="Arrastra o desliza para hacer girar la pirinola"
        />

        {/* Floating Interactive Hint */}
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-xs font-medium tracking-wide text-amber-300/80 bg-slate-950/70 border border-amber-500/20 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm transition-opacity">
            {isSpinning ? '¡Girando la pirinola...!' : '👆 Desliza con el dedo o pulsa Girar'}
          </span>
        </div>

        {/* Speed / Angular Velocity Indicator while spinning */}
        {isSpinning && (
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-mono tabular-nums text-amber-300">En movimiento</span>
          </div>
        )}
      </div>

      {/* Spin Controls & Power Slider */}
      <div className="w-full mt-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400 px-1">
          <span>Fuerza de impulso:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-400 tabular-nums">
              {Math.round(power * 100)}%
            </span>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={power}
              onChange={(e) => setPower(parseFloat(e.target.value))}
              disabled={isSpinning}
              className="w-28 sm:w-36 accent-amber-500 cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        <button
          onClick={() => {
            const baseVel = 30 + power * 16 + (Math.random() * 4 - 2);
            startSpinWithVelocity(baseVel);
          }}
          disabled={isSpinning}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg ${
            isSpinning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white hover:from-amber-400 hover:via-amber-500 hover:to-rose-500 shadow-amber-500/25 hover:shadow-amber-500/40 border border-amber-400/30'
          }`}
        >
          {isSpinning ? (
            <>
              <svg className="animate-spin h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>¡Girando la suerte...!</span>
            </>
          ) : (
            <>
              <span className="text-xl">🌀</span>
              <span>¡GIRAR PIRINOLA!</span>
              <span className="text-xs font-normal opacity-80 ml-1 hidden sm:inline">(Espacio)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
