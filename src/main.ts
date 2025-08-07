import './style.css'
import { provideECSInstanceFunctions } from './ecs'
import { createPlayerEntity, PLAYER_COMPONENT_DEFINITION } from './entities/player'
import { POSITION_COMPONENT_DEFINITION, VELOCITY_COMPONENT_DEFINITION, } from './entities/components'
import { inputMap } from './key'
import { drawSprites, } from './entities/sprite'
import { debugDrawColliders, updateCollisionObjects } from './sat'
import { createEnemy, ENEMY_COMPONENT_DEFINITION } from './entities/enemy'
import { createStaticObstacle } from './entities/obstacle'
import { generateRandomLevel } from './generation'
import { createProjectileInDirection, PROJECTILE_COMPONENT_DEFINITION } from './entities/projectile'
import type { ProjectileComponent } from './entities/projectile'

// Track projectiles that need to be destroyed due to collisions
const projectilesToDestroy: number[] = [];

// Function to mark a projectile for destruction
const markProjectileForDestruction = (entityId: number) => {
  projectilesToDestroy.push(entityId);
};

const app = document.querySelector<HTMLDivElement>('#app')!

const canvas = document.createElement('canvas')
canvas.id = 'gameCanvas'
app.appendChild(canvas)

const context = canvas.getContext('2d')!

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1
  
  const displayWidth = window.innerWidth
  const displayHeight = window.innerHeight
  
  canvas.style.width = displayWidth + 'px'
  canvas.style.height = displayHeight + 'px'
  
  canvas.width = displayWidth * pixelRatio
  canvas.height = displayHeight * pixelRatio
  
  context.scale(pixelRatio, pixelRatio)
}

resizeCanvas()

window.addEventListener('resize', () => {
  context.setTransform(1, 0, 0, 1, 0, 0)
  resizeCanvas()
})

// Mouse click handling for shooting
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // Get player position
  const playerEntities = queryComponents([PLAYER_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION]);
  const playerPositions = Object.values(playerEntities).map(components => components[1] as unknown as { x: number, y: number });
  
  if (playerPositions.length > 0) {
    const playerPos = playerPositions[0];
    
    // Calculate direction from player to mouse click
    const directionX = mouseX - playerPos.x;
    const directionY = mouseY - playerPos.y;
    
    // Normalize direction vector
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    const normalizedX = directionX / length;
    const normalizedY = directionY / length;
    
    // Spawn projectile slightly in front of player (50 pixels ahead)
    const spawnDistance = 50;
    const spawnX = playerPos.x + normalizedX * spawnDistance;
    const spawnY = playerPos.y + normalizedY * spawnDistance;
    
    // Create projectile in that direction
    createProjectileInDirection(spawnX, spawnY, directionX, directionY, 300);
  }
});

export const {
  ecsInstance,
  createEntity,
  destroyEntity,
  addComponent,
  removeComponent,
  getComponent,
  queryComponents,
  runQuery
} = provideECSInstanceFunctions()

generateRandomLevel();
createPlayerEntity();

export const update = () => {
  runQuery([PLAYER_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION], (_entity, [_player, position]) => {
    const speed = 2;
    if (inputMap["ArrowUp"] || inputMap["w"]) {
      position.y -= speed;
    }
    if (inputMap["ArrowDown"] || inputMap["s"]) {
      position.y += speed;
    }
    if (inputMap["ArrowLeft"] || inputMap["a"]) {
      position.x -= speed;
    }
    if (inputMap["ArrowRight"] || inputMap["d"]) {
      position.x += speed;
    }

    
  });

  runQuery([ENEMY_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION], (_entity, [_enemy, position]) => {
  
  const playerEntities = queryComponents([PLAYER_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION]);
  const playerPositions = Object.values(playerEntities).map(components => components[1] as unknown as { x: number, y: number });
  if (playerPositions.length > 0) {
    const playerPos = playerPositions[0];
    const dx = playerPos.x - position.x;
    const dy = playerPos.y - position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 1;
    if (dist > 0) {
      position.x += (dx / dist) * speed;
      position.y += (dy / dist) * speed;
    }
  }

  });

  // Update projectiles - move them and handle lifetime
  runQuery([PROJECTILE_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION, VELOCITY_COMPONENT_DEFINITION], (entity, [projectile, position, velocity]) => {
    const projectileComponent = projectile as ProjectileComponent;
    
    // Update projectile age
    projectileComponent.age = (projectileComponent.age || 0) + 16; // Assuming 60fps, ~16ms per frame
    
    // Remove projectile if it's too old
    if (projectileComponent.age > (projectileComponent.lifetime || 3000)) {
      destroyEntity(entity);
      return;
    }
    
    // Move projectile based on velocity
    position.x += velocity.x * 0.016; // Convert to per-frame movement
    position.y += velocity.y * 0.016;
  });

  const entitiesWithCollision = queryComponents([
    POSITION_COMPONENT_DEFINITION,
    VELOCITY_COMPONENT_DEFINITION,
    {type: "collider"},
  ]);
  const collisionBlobs = Object.values(entitiesWithCollision).map((components, index) => {
    const entityId = Object.keys(entitiesWithCollision)[index];
    const entity = parseInt(entityId);
    
    // Create proper collision callback for projectiles
    let onCollision = components[2].onCollision;
    if (components[2].resolverName === "projectileDestroy") {
      onCollision = () => markProjectileForDestruction(entity);
    }
    
    return {
      colliderName: components[2].colliderName,
      resolverName: components[2].resolverName,
      components,
      onCollision,
    };
  });
  updateCollisionObjects(collisionBlobs as any);
  
  // Destroy projectiles that collided with something
  projectilesToDestroy.forEach(entityId => {
    destroyEntity(entityId);
  });
  projectilesToDestroy.length = 0; // Clear the array
}

function animate() {
  context.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
  
  context.fillStyle = '#242424'
  context.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
  
  const anyKeyPressed = Object.keys(inputMap).find(key => inputMap[key]);

  if(anyKeyPressed) update();

  drawSprites(context);
  
  // Draw projectiles as simple circles
  runQuery([PROJECTILE_COMPONENT_DEFINITION, POSITION_COMPONENT_DEFINITION], (_entity, [_projectile, position]) => {
    context.fillStyle = '#ff0000';
    context.beginPath();
    context.arc(position.x, position.y, 4, 0, 2 * Math.PI);
    context.fill();
  });
  
  const entitiesWithCollision = queryComponents([
    POSITION_COMPONENT_DEFINITION,
    VELOCITY_COMPONENT_DEFINITION,
    {type: "collider"},
  ]);
  const collisionBlobs = Object.values(entitiesWithCollision).map((components) => ({
    colliderName: components[2].colliderName,
    resolverName: components[2].resolverName,
    components,
  }));
  console.log(collisionBlobs)
  debugDrawColliders(collisionBlobs as any, context);
  requestAnimationFrame(animate)
}

animate()
