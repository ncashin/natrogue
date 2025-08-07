import type {
  POSITION_COMPONENT_DEFINITION,
  VELOCITY_COMPONENT_DEFINITION,
} from "./entities/components";
import {
  type ColliderDefinition,
  colliders,
  type CollisionObject,
  registerCollider,
  registerResolver,
  type ResolverDefinition,
} from "./sat";
import {
  subVectors,
  lengthVector,
  normalizeVector,
  addVectors,
  scaleVector,
  dotVectors,
} from "./vector";

export const CIRCLE_COLLIDER_COMPONENT_DEFINITION = {
  type: "collider",
  radius: 20,
  colliderName: "circle",
  resolverName: "pushOut",
};

export type CollisionBlob = CollisionObject & {
  components: [
    typeof POSITION_COMPONENT_DEFINITION,
    typeof VELOCITY_COMPONENT_DEFINITION,
    typeof CIRCLE_COLLIDER_COMPONENT_DEFINITION
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

// Helper function to extract radius from entity
const getRadius = (entity: CollisionBlob) => {
  const colliderComponent = entity.components[2];
  return colliderComponent.radius;
};

export const CIRCLE_COLLIDER: ColliderDefinition<CollisionBlob> = {
  name: "circle",
  getNormals: (collisionObject, other) => {
    const otherCollider = colliders[other.colliderName];
    const position = getPosition(collisionObject);
    const closestPoint = otherCollider.getClosestPoint(
      other,
      position
    );
    const direction = subVectors(closestPoint, position);
    if (lengthVector(direction) > 0) {
      return [normalizeVector(direction)];
    }
    return [];
  },

  getClosestPoint: (collisionObject, point) => {
    const position = getPosition(collisionObject);
    const radius = getRadius(collisionObject);
    const direction = subVectors(point, position);
    if (lengthVector(direction) <= radius) {
      return point;
    }
    return addVectors(
      position,
      scaleVector(normalizeVector(direction), radius)
    );
  },

  calculateProjection: (collisionObject, normal) => {
    const position = getPosition(collisionObject);
    const radius = getRadius(collisionObject);
    const projection = dotVectors(position, normal);
    return {
      min: projection - radius,
      max: projection + radius,
    };
  },

  debugDraw: (collisionObject, context) => {
    const position = getPosition(collisionObject);
    const radius = getRadius(collisionObject);
    const velocity = getVelocity(collisionObject);

    context.save();
    context.strokeStyle = "#ff0000";
    context.lineWidth = 2;

    context.beginPath();
    context.arc(
      position.x,
      position.y,
      radius,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.restore();

    context.save();
    context.fillStyle = "#ff0000";
    context.beginPath();
    context.arc(
      position.x,
      position.y,
      3,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();

    if (velocity) {
      context.save();
      context.strokeStyle = "#00ff00";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(position.x, position.y);
      const scale = 0.1;
      context.lineTo(
        position.x + velocity.x * scale,
        position.y + velocity.y * scale
      );
      context.stroke();
      context.restore();
    }
  },
};

const PUSH_OUT_RESOLVER: ResolverDefinition<CollisionBlob> = {
  name: "pushOut",
  resolveCollision: (objA, _objB, overlapAmount, overlapNormal) => {
    if (overlapNormal) {
      const position = getPosition(objA);
      if (position) {
        position.x += overlapNormal.x * overlapAmount;
        position.y += overlapNormal.y * overlapAmount;
      }
    }
  },
};

registerCollider(CIRCLE_COLLIDER);
registerResolver(PUSH_OUT_RESOLVER);
