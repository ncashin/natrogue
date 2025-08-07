import { createEnemy } from "./entities/enemy";
import { createStaticObstacle } from "./entities/obstacle";

export function generateRandomLevel() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const levelWidth = canvas.width / (window.devicePixelRatio || 1);
    const levelHeight = canvas.height / (window.devicePixelRatio || 1);
    
    const numObstacles = Math.floor(Math.random() * 8) + 5;
    for (let i = 0; i < numObstacles; i++) {
      const x = Math.random() * (levelWidth - 200) + 100;
      const y = Math.random() * (levelHeight - 200) + 100;
      let width, height;
      if (Math.random() < 0.1) {
        width = Math.random() * 350 + 50;
        height = Math.random() * 350 + 50;
      } else {
        width = Math.random() * 150 + 50;
        height = Math.random() * 150 + 50;
      }
      const angle = Math.random() * 360;
      
      createStaticObstacle(x, y, width, height, angle, "obstacle");
    }
    
    const numEnemies = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numEnemies; i++) {
      const x = Math.random() * (levelWidth - 100) + 50;
      const y = Math.random() * (levelHeight - 100) + 50;
      
      createEnemy(x, y);
    }
  }