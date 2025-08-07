import type { Vector } from "./vector";
import { cloneVector, addVectors, subVectors, scaleVector, dotVectors, lengthVector, normalizeVector, perpVector } from "./vector";

export type CollisionObject = {
  colliderName: string;
  resolverName: string;
  collisionEnabled?: boolean;
};

export type ColliderDefinition<T extends CollisionObject = CollisionObject> = {
  name: string;
  getNormals: (collisionObject: T, other: CollisionObject) => Vector[];
  getClosestPoint: (collisionObject: T, point: Vector) => Vector;
  calculateProjection: (
    collisionObject: T,
    normal: Vector
  ) => { min: number; max: number };
  debugDraw?: (collisionObject: T, context: CanvasRenderingContext2D) => void;
};

// objA = object associated with resolver, objB = other object involved in the collision
export type ResolverDefinition<T extends CollisionObject = CollisionObject> = {
  name: string;
  resolveCollision: (
    objA: T,
    objB: CollisionObject,
    overlapAmount: number,
    overlapNormal: Vector
  ) => void;
};

export const resolvers: { [name: string]: ResolverDefinition<any> } = {};
export const registerResolver = (resolver: ResolverDefinition<any>) => {
  resolvers[resolver.name] = resolver;
};
export const unregisterResolver = (name: string) => {
  delete resolvers[name];
};

export const colliders: { [name: string]: ColliderDefinition<any> } = {};
export const registerCollider = (collider: ColliderDefinition<any>) => {
  colliders[collider.name] = collider;
};
export const unregisterCollider = (name: string) => {
  delete colliders[name];
};

// object needs
// - collider - normals, closestPoint for circles, calculateProjection
// - resolver - handleCollision given overlap, normal and other object

// Why is this hard just make it a big object - I want this to be json serializable which means functions make me sad and can't coexist with data

// don't worry I am aware how horrifically unoptimized this is currently only for a small example
export const handleCollisionPair = (
  objA: CollisionObject & { onCollision?: () => void },
  objB: CollisionObject & { onCollision?: () => void }
) => {

  const colliderA = colliders[objA.colliderName];
  const resolverA = resolvers[objA.resolverName];

  if (!colliderA || !resolverA) {
    console.warn(
      `Missing collider or resolver for object A: ${objA.colliderName}, ${objA.resolverName}`
    );
    return;
  }

  const colliderB = colliders[objB.colliderName];
  const resolverB = resolvers[objB.resolverName];

  if (!colliderB || !resolverB) {
    console.warn(
      `Missing collider or resolver for object B: ${objB.colliderName}, ${objB.resolverName}`
    );
    return;
  }

  const normals = [
    ...colliderA.getNormals(objA, objB),
    ...colliderB.getNormals(objB, objA),
  ];

  let minOverlap = Infinity;
  let smallestNormal: Vector | null = null;
  let direction: number = 1;

  for (const normal of normals) {
    const n = normalizeVector(normal);
    const projA = colliderA.calculateProjection(objA, n);
    const projB = colliderB.calculateProjection(objB, n);

    const overlapA = projB.max - projA.min;
    const overlapB = projA.max - projB.min;

    if (overlapA <= 0 || overlapB <= 0) {
      minOverlap = 0;
      smallestNormal = null;
      break;
    }

    let currentOverlap: number;
    let currentDirection: number;

    if (overlapA < overlapB) {
      currentOverlap = overlapA;
      currentDirection = 1;
    } else {
      currentOverlap = overlapB;
      currentDirection = -1;
    }

    if (currentOverlap < minOverlap) {
      minOverlap = currentOverlap;
      smallestNormal = n;
      direction = currentDirection;
    }
  }

  if (smallestNormal && minOverlap > 0 && minOverlap < Infinity) {
    resolverA.resolveCollision(
      objA,
      objB,
      minOverlap * direction,
      smallestNormal
    );
    resolverB.resolveCollision(
      objB,
      objA,
      minOverlap * -direction,
      smallestNormal
    );
    
    // Execute collision callbacks if they exist
    if (objA.onCollision) {
      objA.onCollision();
    }
    if (objB.onCollision) {
      objB.onCollision();
    }
  }
};

export const updateCollisionObjects = (collisionObjects: CollisionObject[]) => {
  for (let i = 0; i < collisionObjects.length; i++) {
    const objA = collisionObjects[i];

    for (let j = i + 1; j < collisionObjects.length; j++) {
      const objB = collisionObjects[j];
      handleCollisionPair(objA, objB);
    }
  }
};

export const debugDrawColliders = (
  collisionObjects: CollisionObject[],
  context: CanvasRenderingContext2D
) => {
  collisionObjects.forEach((obj) => {
    const collider = colliders[obj.colliderName];
    if (!collider || !collider.debugDraw) return;
    collider.debugDraw(obj, context);
  });
};

/* Example Collision Object types */
export type RectangleCollisionObject = CollisionObject & {
  position: Vector;
  width: number;
  height: number;
  color?: string;
  isColliding?: boolean;
  velocity?: Vector;
  angle: number;
  angularVelocity?: number;
};

export type CircleCollisionObject = CollisionObject & {
  position: Vector;
  velocity: Vector;
  radius: number;
  color?: string;
  isColliding?: boolean;
};

/* Collider and Resolver Examples */
export const RECTANGLE_COLLIDER: ColliderDefinition<RectangleCollisionObject> =
  {
    name: "rectangle",
    getNormals: (collisionObject, _other) => {
      const angle = ((collisionObject.angle || 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const rotate = (v: Vector) =>
        ({ x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos });

      return [rotate({ x: 0, y: 1 }), rotate({ x: 1, y: 0 })];
    },

    getClosestPoint: (collisionObject, point) => {
      const center = collisionObject.position;
      const width = collisionObject.width;
      const height = collisionObject.height;
      const angle = ((collisionObject.angle || 0) * Math.PI) / 180;

      const rectCenter = cloneVector(center);
      rectCenter.x += width / 2;
      rectCenter.y += height / 2;

      const localPoint = subVectors(point, rectCenter);
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);

      const rotatedPoint = {
        x: localPoint.x * cos - localPoint.y * sin,
        y: localPoint.x * sin + localPoint.y * cos
      };

      const hw = width / 2;
      const hh = height / 2;
      const clampedX = Math.max(-hw, Math.min(hw, rotatedPoint.x));
      const clampedY = Math.max(-hh, Math.min(hh, rotatedPoint.y));

      const localClamped = { x: clampedX, y: clampedY };
      const cos2 = Math.cos(angle);
      const sin2 = Math.sin(angle);

      const worldClamped = {
        x: localClamped.x * cos2 - localClamped.y * sin2,
        y: localClamped.x * sin2 + localClamped.y * cos2
      };

      return addVectors(rectCenter, worldClamped);
    },

    calculateProjection: (collisionObject, normal) => {
      const width = collisionObject.width;
      const height = collisionObject.height;
      const angle = ((collisionObject.angle || 0) * Math.PI) / 180;
      const center = collisionObject.position;
      const rectCenter = cloneVector(center);
      rectCenter.x += width / 2;
      rectCenter.y += height / 2;

      const hw = width / 2;
      const hh = height / 2;

      const localCorners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
      ];

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const corners = localCorners.map((localCorner) => {
        const worldCorner = {
          x: localCorner.x * cos - localCorner.y * sin,
          y: localCorner.x * sin + localCorner.y * cos
        };
        return addVectors(rectCenter, worldCorner);
      });

      const projections = corners.map((corner) => dotVectors(corner, normal));
      return {
        min: Math.min(...projections),
        max: Math.max(...projections),
      };
    },

    debugDraw: (collisionObject, context) => {
      const center = collisionObject.position;
      const width = collisionObject.width;
      const height = collisionObject.height;
      const angle = ((collisionObject.angle || 0) * Math.PI) / 180;

      const rectCenter = cloneVector(center);
      rectCenter.x += width / 2;
      rectCenter.y += height / 2;

      context.save();
      context.strokeStyle = "#ff0000";
      context.lineWidth = 2;

      context.translate(rectCenter.x, rectCenter.y);
      context.rotate(angle);

      context.strokeRect(-width / 2, -height / 2, width, height);
      context.restore();

      context.save();
      context.fillStyle = "#ff0000";
      context.beginPath();
      context.arc(rectCenter.x, rectCenter.y, 3, 0, Math.PI * 2);
      context.fill();
      context.restore();
    },
  };
export const STATIC_RESOLVER: ResolverDefinition<RectangleCollisionObject> = {
  name: "static",
  resolveCollision: (_objA, _objB, _overlapAmount, _overlapNormal) => {},
};

export const CIRCLE_COLLIDER: ColliderDefinition<CircleCollisionObject> = {
  name: "circle",
  getNormals: (collisionObject, other) => {
    const otherCollider = colliders[other.colliderName];
    const closestPoint = otherCollider.getClosestPoint(
      other,
      collisionObject.position
    );
    const direction = subVectors(closestPoint, collisionObject.position);
    if (lengthVector(direction) > 0) {
      return [normalizeVector(direction)];
    }
    return [];
  },

  getClosestPoint: (collisionObject, point) => {
    const direction = subVectors(point, collisionObject.position);
    if (lengthVector(direction) <= collisionObject.radius) {
      return point;
    }
    return addVectors(
      collisionObject.position,
      scaleVector(normalizeVector(direction), collisionObject.radius)
    );
  },

  calculateProjection: (collisionObject, normal) => {
    const projection = dotVectors(collisionObject.position, normal);
    return {
      min: projection - collisionObject.radius,
      max: projection + collisionObject.radius,
    };
  },

  debugDraw: (collisionObject, context) => {
    context.save();
    context.strokeStyle = "#ff0000";
    context.lineWidth = 2;

    context.beginPath();
    context.arc(
      collisionObject.position.x,
      collisionObject.position.y,
      collisionObject.radius,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.restore();

    context.save();
    context.fillStyle = "#ff0000";
    context.beginPath();
    context.arc(
      collisionObject.position.x,
      collisionObject.position.y,
      3,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();

    if (collisionObject.velocity) {
      context.save();
      context.strokeStyle = "#00ff00";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(collisionObject.position.x, collisionObject.position.y);
      const scale = 0.1;
      context.lineTo(
        collisionObject.position.x + collisionObject.velocity.x * scale,
        collisionObject.position.y + collisionObject.velocity.y * scale
      );
      context.stroke();
      context.restore();
    }
  },
};

export const BOUNCY_RESOLVER: ResolverDefinition<CircleCollisionObject> = {
  name: "bouncy",
  resolveCollision: (objA, _objB, overlapAmount, overlapNormal) => {
    objA.position = addVectors(
      objA.position,
      scaleVector(normalizeVector(overlapNormal), overlapAmount)
    );

    const n = normalizeVector(overlapNormal);
    const vDotN = dotVectors(objA.velocity, n);
    const COLLISION_DAMPING = 0.7;

    objA.velocity = subVectors(objA.velocity, scaleVector(n, (1 + COLLISION_DAMPING) * vDotN));

    const tangent = perpVector(n);
    const vDotT = dotVectors(objA.velocity, tangent);
    const FRICTION = 0.2;
    objA.velocity = subVectors(objA.velocity, scaleVector(tangent, vDotT * FRICTION));

    const VELOCITY_EPSILON_X = 10;
    const VELOCITY_EPSILON_Y = 40;
    let vx = objA.velocity.x;
    let vy = objA.velocity.y;
    if (Math.abs(vx) < VELOCITY_EPSILON_X) vx = 0;
    if (Math.abs(vy) < VELOCITY_EPSILON_Y) vy = 0;
    objA.velocity = { x: vx, y: vy };
  },
};

// Projectile resolver that destroys the projectile on contact
export const PROJECTILE_DESTROY_RESOLVER: ResolverDefinition<any> = {
  name: "projectileDestroy",
  resolveCollision: (objA, _objB, _overlapAmount, _overlapNormal) => {
    // This resolver will be used with a callback to destroy the entity
    // The actual destruction will be handled in the main collision loop
    if (objA.onCollision) {
      objA.onCollision();
    }
  },
};

// Register the projectile destroy resolver
registerResolver(PROJECTILE_DESTROY_RESOLVER);

/* CollisionObject Examples */
// @ts-expect-error unused
const staticRectangleObject: RectangleCollisionObject = {
  colliderName: "rectangle",
  resolverName: "static",

  position: { x: 600, y: 300 },
  width: 300,
  height: 100,
  color: "#ffaa00",
  isColliding: false,
  velocity: { x: 0, y: 0 },
  angle: 0,
  angularVelocity: 0,
  collisionEnabled: true,
};

// @ts-expect-error unused
const bouncyCircleObject: CircleCollisionObject = {
  colliderName: "circle",
  resolverName: "bouncy",

  position: { x: 700, y: 500 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  collisionEnabled: true,
};
