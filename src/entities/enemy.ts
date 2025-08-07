import { addComponent } from "../main";
import { createKinematicEntity } from "./components";
import { SPRITE_COMPONENT_DEFINITION } from "./sprite";

export const ENEMY_COMPONENT_DEFINITION = {
  type: "enemy",
};

export function createEnemy(
  x: number = 500,
  y: number = 500,
  vx: number = 0,
  vy: number = 0
) {
  const enemyEntity = createKinematicEntity(x, y, vx, vy);
  addComponent(enemyEntity, ENEMY_COMPONENT_DEFINITION);
  addComponent(enemyEntity, {
    ...SPRITE_COMPONENT_DEFINITION,
    name: "enemy",
  width: 64,
  height: 64,
  });

  return enemyEntity;
}
