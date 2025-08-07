import { runQuery } from "../main";
import { POSITION_COMPONENT_DEFINITION } from "./components";

export type SpriteComponent = {
  type: "sprite";
  name: string;
  width?: number;
  height?: number;
};
export const SPRITE_COMPONENT_DEFINITION: SpriteComponent = {
  type: "sprite",
  name: "",
};

export function loadImage(source: string): HTMLImageElement {
  const image = new window.Image();
  image.src = source;
  return image;
}

export const sprites: Record<string, HTMLImageElement> = {
  player: loadImage(import.meta.env.BASE_URL + "vite.svg"),
  enemy: loadImage(import.meta.env.BASE_URL + "enemy.png"),
};

export function drawSprites(context: CanvasRenderingContext2D) {
  runQuery(
    [POSITION_COMPONENT_DEFINITION, SPRITE_COMPONENT_DEFINITION],
    (_entity, [position, sprite]) => {
      const image = sprites[sprite.name];
      if (image && image.naturalWidth && image.naturalHeight) {
        const width = sprite.width || image.width;
        const height = sprite.height || image.height;
        context.drawImage(
          image,
          position.x - width / 2,
          position.y - height / 2,
          width,
          height
        );
      }
    }
  );
}
