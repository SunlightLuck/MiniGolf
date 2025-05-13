import * as THREE from 'three';
import { Ball } from './Ball';
import { PowerLine } from './PowerLine';
import { Tree } from './Tree';
import { Hole } from './Hole';

export class Game {
  scene: THREE.Scene;
  ball: Ball;
  powerLine?: PowerLine;
  isDragging: boolean = false;
  isRotating: boolean = false;
  private trees: Tree[] = [];
  private borders: THREE.Mesh[] = [];
  private isMobile: boolean;
  private rotationSpeed: number;
  private hole!: Hole;
  private isGameWon: boolean = false;
  private restartButton?: HTMLButtonElement;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.ball = new Ball(new THREE.Vector3(0, 0.021, 0));
    this.scene.add(this.ball.mesh);

    this.createBorders();
    this.createTrees();
    this.createHole();

    this.isMobile = 'ontouchstart' in window;
    this.rotationSpeed = this.isMobile ? 1 : 2; // Réduire la sensibilité sur mobile
  }

  private createBorders() {
    const borderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.8
    });

    // Dimensions encore plus réduites
    const width = 1.5;  // Réduit de 3 à 1.5
    const height = 1.5; // Réduit de 3 à 1.5
    const borderHeight = 0.05; // Réduit de 0.1 à 0.05
    const borderThickness = 0.02; // Réduit de 0.05 à 0.02

    // Créer les 4 bordures
    const borders = [
      // Bordure gauche
      new THREE.BoxGeometry(borderThickness, borderHeight, height),
      // Bordure droite
      new THREE.BoxGeometry(borderThickness, borderHeight, height),
      // Bordure avant
      new THREE.BoxGeometry(width + borderThickness * 2, borderHeight, borderThickness),
      // Bordure arrière
      new THREE.BoxGeometry(width + borderThickness * 2, borderHeight, borderThickness)
    ];

    const positions = [
      [-width/2 - borderThickness/2, borderHeight/2, 0],
      [width/2 + borderThickness/2, borderHeight/2, 0],
      [0, borderHeight/2, -height/2 - borderThickness/2],
      [0, borderHeight/2, height/2 + borderThickness/2]
    ];

    positions.forEach((pos, i) => {
      const border = new THREE.Mesh(borders[i], borderMaterial);
      border.position.set(pos[0], pos[1], pos[2]);
      border.castShadow = true;
      border.receiveShadow = true;
      this.borders.push(border);
      this.scene.add(border);
    });
  }

  private createTrees() {
    const treePositions = [
      new THREE.Vector3(-0.6, 0, -0.6),  // Positions réduites de moitié
      new THREE.Vector3(0.6, 0, -0.6),
      new THREE.Vector3(-0.6, 0, 0.6),
      new THREE.Vector3(0.6, 0, 0.6),
      new THREE.Vector3(0, 0, -0.7),
      new THREE.Vector3(-0.7, 0, 0),
      new THREE.Vector3(0.7, 0, 0),
    ];

    treePositions.forEach(position => {
      const tree = new Tree(position);
      this.trees.push(tree);
      this.scene.add(tree.mesh);
    });
  }

  private createHole() {
    this.hole = new Hole(new THREE.Vector3(0.5, 0, 0.5));
    this.scene.add(this.hole.mesh);
  }

  update(delta: number) {
    if (!this.isGameWon) {
      this.ball.update(delta);
      this.hole.update(delta);
      
      // Check for hole collision
      if (this.hole.isBallInHole(this.ball.mesh.position)) {
        this.handleWin();
      }
      
      // Vérifier les collisions avec les bordures
      const ballPosition = this.ball.mesh.position;
      const radius = 0.01;

      // Collisions avec les bordures X
      if (ballPosition.x < -0.75 + radius) {
        ballPosition.x = -0.75 + radius;
        this.ball.velocity.x *= -0.5;
      } else if (ballPosition.x > 0.75 - radius) {
        ballPosition.x = 0.75 - radius;
        this.ball.velocity.x *= -0.5;
      }

      // Collisions avec les bordures Z
      if (ballPosition.z < -0.75 + radius) {
        ballPosition.z = -0.75 + radius;
        this.ball.velocity.z *= -0.5;
      } else if (ballPosition.z > 0.75 - radius) {
        ballPosition.z = 0.75 - radius;
        this.ball.velocity.z *= -0.5;
      }
    }
  }

  private handleWin() {
    this.isGameWon = true;
    this.ball.velocity.set(0, 0, 0);
    
    // Create restart button
    this.restartButton = document.createElement('button');
    this.restartButton.textContent = 'Restart';
    this.restartButton.style.position = 'absolute';
    this.restartButton.style.top = '50%';
    this.restartButton.style.left = '50%';
    this.restartButton.style.transform = 'translate(-50%, -50%)';
    this.restartButton.style.padding = '10px 20px';
    this.restartButton.style.fontSize = '20px';
    this.restartButton.style.backgroundColor = '#4CAF50';
    this.restartButton.style.color = 'white';
    this.restartButton.style.border = 'none';
    this.restartButton.style.borderRadius = '5px';
    this.restartButton.style.cursor = 'pointer';
    
    this.restartButton.addEventListener('click', () => this.restart());
    document.body.appendChild(this.restartButton);
  }

  private restart() {
    this.isGameWon = false;
    this.ball.mesh.position.set(0, 0.021, 0);
    this.ball.velocity.set(0, 0, 0);
    if (this.restartButton) {
      document.body.removeChild(this.restartButton);
      this.restartButton = undefined;
    }
  }

  strikeBall(direction: THREE.Vector3, power: number) {
    const force = direction.normalize().multiplyScalar(power);
    this.ball.applyForce(force);
  }

  setWind(wind: THREE.Vector3) {
    this.ball.wind.copy(wind);
  }

  handleMouseDown(position: THREE.Vector3, clientX: number) {
    if (this.isBallClicked(position)) {
      this.isDragging = true;
      this.powerLine = new PowerLine(this.scene);
      this.powerLine.show();
    } else {
      this.isRotating = true;
      this.lastMouseX = clientX;
    }
  }

  handleMouseMove(position: THREE.Vector3, clientX: number) {
    if (this.isDragging) {
      const sensitivity = this.isMobile ? 0.5 : 0.8;
      if (this.powerLine) {
        this.powerLine.update(
          this.ball.mesh.position,
          position.multiplyScalar(sensitivity)
        );
      }
    } else if (this.isRotating) {
      const deltaX = (clientX - this.lastMouseX) * (this.isMobile ? 0.003 : 0.008);
      this.cameraAngle += deltaX * this.rotationSpeed;
      this.lastMouseX = clientX;
    }
  }

  handleMouseUp() {
    if (this.isDragging && this.powerLine) {
      const { direction, power } = this.powerLine.getPowerAndDirection();
      console.log(direction, power);
      this.strikeBall(direction, power);
      this.powerLine.hide();
    }
    this.isDragging = false;
    this.isRotating = false;
    if (this.powerLine) {
      this.scene.remove(this.powerLine.line);
      this.powerLine = undefined;
    }
  }

  isBallClicked(position: THREE.Vector3): boolean {
    const distance = position.distanceTo(this.ball.mesh.position);
    return distance < 0.5; // Ajustez cette valeur selon vos besoins
  }

  private lastMouseX: number = 0;
  cameraAngle: number = 0;
}
