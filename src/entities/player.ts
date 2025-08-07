import { addComponent } from "../main";
import { createKinematicEntity } from "./components";
import { SPRITE_COMPONENT_DEFINITION } from "./sprite";

export const PLAYER_COMPONENT_DEFINITION = {
  type: "Player",
};

export function createPlayerEntity(x: number = 0, y: number = 0) {
  const playerEntity = createKinematicEntity(x, y);
  addComponent(playerEntity, PLAYER_COMPONENT_DEFINITION);
  addComponent(playerEntity, {
    ...SPRITE_COMPONENT_DEFINITION,
    name: "player",
  });

}
