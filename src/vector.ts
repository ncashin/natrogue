export type Vector = { x: number; y: number };

// Utility functions for Vector objects
export const cloneVector = (v: Vector): Vector => ({ x: v.x, y: v.y });

export const addVectors = (a: Vector, b: Vector): Vector => ({ x: a.x + b.x, y: a.y + b.y });

export const subVectors = (a: Vector, b: Vector): Vector => ({ x: a.x - b.x, y: a.y - b.y });

export const scaleVector = (v: Vector, s: number): Vector => ({ x: v.x * s, y: v.y * s });

export const dotVectors = (a: Vector, b: Vector): number => a.x * b.x + a.y * b.y;

export const lengthVector = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);

export const lengthSqVector = (v: Vector): number => v.x * v.x + v.y * v.y;

export const normalizeVector = (v: Vector): Vector => {
  const len = lengthVector(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const limitVector = (v: Vector, max: number): Vector => {
  const len = lengthVector(v);
  if (len <= max) return cloneVector(v);
  return scaleVector(normalizeVector(v), max);
};

export const perpVector = (v: Vector): Vector => ({ x: -v.y, y: v.x });

export const distanceToVector = (a: Vector, b: Vector): number => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

export const distanceToSqVector = (a: Vector, b: Vector): number => {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
};

export const fromVector = (obj: { x: number; y: number }): Vector => ({ x: obj.x, y: obj.y });
