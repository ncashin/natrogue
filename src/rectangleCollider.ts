import type {
  POSITION_COMPONENT_DEFINITION,
  VELOCITY_COMPONENT_DEFINITION,
} from "./entities/components";
import {
  type ColliderDefinition,
  type CollisionObject,
  registerCollider,
  registerResolver,
  type ResolverDefinition,
} from "./sat";
import { subVectors, addVectors, dotVectors, cloneVector } from "./vector";

export const RECTANGLE_COLLIDER_COMPONENT_DEFINITION = {
  type: "collider",
  width: 50,
  height: 50,
  angle: 0,
  colliderName: "rectangle",
  resolverName: "static",
};

export type CollisionBlob = CollisionObject & {
  components: [
    typeof POSITION_COMPONENT_DEFINITION,
    typeof VELOCITY_COMPONENT_DEFINITION,
    typeof RECTANGLE_COLLIDER_COMPONENT_DEFINITION
  ];
};

// Helper function to extract position from entity
const getPosition = (entity: CollisionBlob) => {
  return entity.components[0];
};

// Helper function to extract velocity from entity
const getVelocity = (entity: CollisionBlob) => {
  return entity.components[1];
};

// Helper function to extract rectangle properties from entity
const getRectangleProps = (entity: CollisionBlob) => {
  const colliderComponent = entity.components[2];
  return {
    width: colliderComponent.width,
    height: colliderComponent.height,
    angle: colliderComponent.angle || 0,
  };
};

export const RECTANGLE_COLLIDER: ColliderDefinition<CollisionBlob> = {
  name: "rectangle",
  getNormals: (collisionObject, _other) => {
    const angle = (getRectangleProps(collisionObject).angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotate = (v: { x: number; y: number }) => ({
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    });

    return [rotate({ x: 0, y: 1 }), rotate({ x: 1, y: 0 })];
  },

  getClosestPoint: (collisionObject, point) => {
    const position = getPosition(collisionObject);
    const { width, height, angle } = getRectangleProps(collisionObject);

    const rectCenter = cloneVector(position);
    rectCenter.x += width / 2;
    rectCenter.y += height / 2;

    const localPoint = subVectors(point, rectCenter);
    const cos = Math.cos((-angle * Math.PI) / 180);
    const sin = Math.sin((-angle * Math.PI) / 180);

    const rotatedPoint = {
      x: localPoint.x * cos - localPoint.y * sin,
      y: localPoint.x * sin + localPoint.y * cos,
    };

    const hw = width / 2;
    const hh = height / 2;
    const clampedX = Math.max(-hw, Math.min(hw, rotatedPoint.x));
    const clampedY = Math.max(-hh, Math.min(hh, rotatedPoint.y));

    const localClamped = { x: clampedX, y: clampedY };
    const cos2 = Math.cos((angle * Math.PI) / 180);
    const sin2 = Math.sin((angle * Math.PI) / 180);

    const worldClamped = {
      x: localClamped.x * cos2 - localClamped.y * sin2,
      y: localClamped.x * sin2 + localClamped.y * cos2,
    };

    return addVectors(rectCenter, worldClamped);
  },

  calculateProjection: (collisionObject, normal) => {
    const position = getPosition(collisionObject);
    const { width, height, angle } = getRectangleProps(collisionObject);
    const rectCenter = cloneVector(position);
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

    const cos = Math.cos((angle * Math.PI) / 180);
    const sin = Math.sin((angle * Math.PI) / 180);

    const corners = localCorners.map((localCorner) => {
      const worldCorner = {
        x: localCorner.x * cos - localCorner.y * sin,
        y: localCorner.x * sin + localCorner.y * cos,
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
    const position = getPosition(collisionObject);
    const { width, height, angle } = getRectangleProps(collisionObject);

    const rectCenter = cloneVector(position);
    rectCenter.x += width / 2;
    rectCenter.y += height / 2;

    context.save();
    context.strokeStyle = "#ff0000";
    context.lineWidth = 2;

    context.translate(rectCenter.x, rectCenter.y);
    context.rotate((angle * Math.PI) / 180);

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

const STATIC_RESOLVER: ResolverDefinition<CollisionBlob> = {
  name: "static",
  resolveCollision: (_objA, _objB, _overlapAmount, _overlapNormal) => {},
};

registerCollider(RECTANGLE_COLLIDER);
registerResolver(STATIC_RESOLVER);
