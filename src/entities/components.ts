import { CIRCLE_COLLIDER_COMPONENT_DEFINITION } from "../circleCollider";
import { addComponent, createEntity } from "../main";

export const POSITION_COMPONENT_DEFINITION = {
  type: "Position",
  x: 0,
  y: 0,
};

export const VELOCITY_COMPONENT_DEFINITION = {
  type: "Velocity",
  x: 0,
  y: 0,
};

export function createKinematicEntity(
  x: number = 0,
  y: number = 0,
  vx: number = 0,
  vy: number = 0
) {
  const entity = createEntity();
  addComponent(entity, { ...POSITION_COMPONENT_DEFINITION, x, y });
  addComponent(entity, { ...VELOCITY_COMPONENT_DEFINITION, x: vx, y: vy });
  addComponent(entity, CIRCLE_COLLIDER_COMPONENT_DEFINITION);
  return entity;
}
