import { addComponent } from "../main";
import { createEntity } from "../main";
import { createKinematicEntity, POSITION_COMPONENT_DEFINITION } from "./components";
import { RECTANGLE_COLLIDER_COMPONENT_DEFINITION } from "../rectangleCollider";
import { SPRITE_COMPONENT_DEFINITION } from "./sprite";

export const OBSTACLE_COMPONENT_DEFINITION = {
  type: "Obstacle",
};

export function createStaticObstacle(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  angle: number = 0,
  spriteName: string = "obstacle"
) {
  const obstacleEntity = createKinematicEntity(x, y);
  
  addComponent(obstacleEntity, OBSTACLE_COMPONENT_DEFINITION);
  addComponent(obstacleEntity, {
    ...RECTANGLE_COLLIDER_COMPONENT_DEFINITION,
    width,
    height,
    angle,
  });
  addComponent(obstacleEntity, {
    ...SPRITE_COMPONENT_DEFINITION,
    name: spriteName,
  });

  return obstacleEntity;
}
