import { addComponent } from "../main";
import { createKinematicEntity } from "./components";
import { SPRITE_COMPONENT_DEFINITION } from "./sprite";

export const PROJECTILE_COMPONENT_DEFINITION = {
  type: "projectile",
};

export type ProjectileComponent = {
  type: "projectile";
  damage?: number;
  lifetime?: number;
  age?: number;
};

export function createProjectile(
  x: number = 0,
  y: number = 0,
  vx: number = 0,
  vy: number = 0,
  damage: number = 10,
  lifetime: number = 3000 // 3 seconds in milliseconds
) {
  const projectileEntity = createKinematicEntity(x, y, vx, vy);
  
  // Add projectile component with damage and lifetime
  addComponent(projectileEntity, {
    ...PROJECTILE_COMPONENT_DEFINITION,
    damage,
    lifetime,
    age: 0,
  });
  
  // Add sprite component for rendering
  addComponent(projectileEntity, {
    ...SPRITE_COMPONENT_DEFINITION,
    name: "projectile",
    width: 8,
    height: 8,
  });

  // Add collision component with projectile destroy resolver
  addComponent(projectileEntity, {
    type: "collider",
    radius: 4, // Smaller collision radius for projectiles
    colliderName: "circle",
    resolverName: "projectileDestroy",
  });

  return projectileEntity;
}

// Helper function to create a projectile in a specific direction
export function createProjectileInDirection(
  x: number,
  y: number,
  directionX: number,
  directionY: number,
  speed: number = 200,
  damage: number = 10,
  lifetime: number = 3000
) {
  // Normalize direction vector
  const length = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedX = directionX / length;
  const normalizedY = directionY / length;
  
  // Calculate velocity based on speed and direction
  const vx = normalizedX * speed;
  const vy = normalizedY * speed;
  
  return createProjectile(x, y, vx, vy, damage, lifetime);
}

// Helper function to create a projectile towards a target
export function createProjectileTowardsTarget(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  speed: number = 200,
  damage: number = 10,
  lifetime: number = 3000
) {
  const directionX = targetX - startX;
  const directionY = targetY - startY;
  
  return createProjectileInDirection(startX, startY, directionX, directionY, speed, damage, lifetime);
}

