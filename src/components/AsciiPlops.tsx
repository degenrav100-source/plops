import { useEffect, useRef } from "react";

/** The plops mark as a pixel grid (sampled from public/logo.png). */
const GRID = [
  "...##..##",
  "...##..##",
  "...######",
  "##.######",
  "..#######",
  "..#######",
  ".....##..",
  ".....##..",
];

const RAMP = ".,-~:;=!*#$@";
const DEPTH = 1.1; // half thickness of the extruded mark

interface Cell {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const CELLS: Cell[] = (() => {
  const rows = GRID.length;
  const cols = GRID[0].length;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (GRID[r][c] !== "#") continue;
      cells.push({ x0: c - cx - 0.5, x1: c - cx + 0.5, y0: cy - r - 0.5, y1: cy - r + 0.5 });
    }
  }
  return cells;
})();

const RADIUS_XZ = Math.hypot(GRID[0].length / 2, DEPTH);
const RADIUS_Y = GRID.length / 2 + DEPTH;

/** Light from the upper left, slightly towards the viewer. */
const LIGHT = (() => {
  const [x, y, z] = [-0.4, 0.62, -0.68];
  const len = Math.hypot(x, y, z);
  return { x: x / len, y: y / len, z: z / len };
})();

/**
 * Ray-casts the extruded mark, one ray per character cell, so the surface is
 * always solid (a point cloud leaves holes once the mark is close to the camera).
 */
function renderFrame(pitch: number, yaw: number, cols: number, rows: number): string {
  const scale = Math.min((cols * 0.94) / (2 * RADIUS_XZ), (rows * 0.94) / RADIUS_Y);
  const cosA = Math.cos(pitch);
  const sinA = Math.sin(pitch);
  const cosB = Math.cos(yaw);
  const sinB = Math.sin(yaw);

  // camera looks along +z; transform the ray into object space (inverse rotation)
  const dz = { x: 0, y: 0, z: 1 };
  const dy1 = dz.y * cosA + dz.z * sinA;
  const dz1 = -dz.y * sinA + dz.z * cosA;
  const dirObj = {
    x: dz.x * cosB - dz1 * sinB,
    y: dy1,
    z: dz.x * sinB + dz1 * cosB,
  };

  let out = "";
  for (let sy = 0; sy < rows; sy++) {
    const v = -(sy + 0.5 - rows / 2) * (2 / scale);
    for (let sx = 0; sx < cols; sx++) {
      const u = (sx + 0.5 - cols / 2) / scale;

      if (Math.abs(u) > RADIUS_XZ || Math.abs(v) > RADIUS_Y) {
        out += " ";
        continue;
      }

      // ray origin in world space, pushed back behind the mark
      const oy1 = v * cosA + -20 * sinA;
      const oz1 = -v * sinA + -20 * cosA;
      const ox = u * cosB - oz1 * sinB;
      const oz = u * sinB + oz1 * cosB;
      const oy = oy1;

      let bestT = Infinity;
      let nAxis = 0;
      let nSign = 0;

      for (const cell of CELLS) {
        let tMin = -Infinity;
        let tMax = Infinity;
        let axis = 0;
        let sign = 0;

        // slab test on each axis
        const bounds: [number, number, number, number][] = [
          [cell.x0, cell.x1, ox, dirObj.x],
          [cell.y0, cell.y1, oy, dirObj.y],
          [-DEPTH, DEPTH, oz, dirObj.z],
        ];
        let hit = true;
        for (let a = 0; a < 3; a++) {
          const [lo, hi, o, d] = bounds[a];
          if (Math.abs(d) < 1e-9) {
            if (o < lo || o > hi) {
              hit = false;
              break;
            }
            continue;
          }
          let t0 = (lo - o) / d;
          let t1 = (hi - o) / d;
          let s = -1;
          if (t0 > t1) {
            const tmp = t0;
            t0 = t1;
            t1 = tmp;
            s = 1;
          }
          if (t0 > tMin) {
            tMin = t0;
            axis = a;
            sign = s;
          }
          if (t1 < tMax) tMax = t1;
          if (tMin > tMax) {
            hit = false;
            break;
          }
        }
        if (!hit || tMax < 0 || tMin >= bestT) continue;
        bestT = tMin;
        nAxis = axis;
        nSign = sign;
      }

      if (bestT === Infinity) {
        out += " ";
        continue;
      }

      // object-space normal → world space
      const on = { x: 0, y: 0, z: 0 };
      if (nAxis === 0) on.x = nSign;
      else if (nAxis === 1) on.y = nSign;
      else on.z = nSign;

      const wx = on.x * cosB + on.z * sinB;
      const wz0 = -on.x * sinB + on.z * cosB;
      const wy = on.y * cosA - wz0 * sinA;
      const wz = on.y * sinA + wz0 * cosA;

      const diffuse = (wx * LIGHT.x + wy * LIGHT.y + wz * LIGHT.z + 1) / 2;
      // surfaces closer to the camera read brighter, which gives the spin some depth
      const depth = (RADIUS_XZ - (bestT - 20)) / (2 * RADIUS_XZ);
      const lum = 0.74 * diffuse + 0.26 * depth;
      const level = Math.max(0, Math.min(RAMP.length - 1, Math.round(lum * (RAMP.length - 1))));
      out += RAMP[level];
    }
    if (sy < rows - 1) out += "\n";
  }
  return out;
}

interface Props {
  cols?: number;
  rows?: number;
  /** rotation speed multiplier */
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** The plops mark, extruded and spinning, drawn as monochrome ASCII. */
export default function AsciiPlops({
  cols = 72,
  rows = 28,
  speed = 1,
  className = "",
  style,
}: Props) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pitch = 0.35;
    let yaw = 0.7;
    el.textContent = renderFrame(pitch, yaw, cols, rows);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (time - last < 1000 / 30) return;
      const dt = last === 0 ? 16 : Math.min(time - last, 120);
      last = time;
      pitch += 0.00028 * dt * speed;
      yaw += 0.00105 * dt * speed;
      el.textContent = renderFrame(pitch, yaw, cols, rows);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (raf === 0) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cols, rows, speed]);

  return (
    <pre
      ref={ref}
      aria-hidden="true"
      className={`select-none whitespace-pre font-mono leading-none ${className}`}
      style={style}
    />
  );
}
