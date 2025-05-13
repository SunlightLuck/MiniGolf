import * as THREE from 'three';
import { Ball } from './Ball';
import { Game } from './Game';
import { TouchControls } from './TouchControls';
import { OrientationManager } from './OrientationManager';

// Ajustez ces valeurs selon vos préférences
const cameraOffset = new THREE.Vector3(0, 0.3, 0.8);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 4, 3);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;
light.shadow.camera.left = -2;
light.shadow.camera.right = 2;
light.shadow.camera.top = 2;
light.shadow.camera.bottom = -2;
scene.add(light);

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // brighter ambient light

scene.add(ambientLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-2, 3, -3); // opposite direction
scene.add(fillLight);
// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x008800 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Game logic
const game = new Game(scene);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  game.update(delta);
  updateCamera();
  renderer.render(scene, camera);
}
animate();

// Example input
window.addEventListener('keydown', () => {
  const dir = new THREE.Vector3(1, 0, 0);
  game.strikeBall(dir, 5);
});

function updateCamera() {
  const ballPosition = game.ball.mesh.position;
  
  // Calculer la nouvelle position de la caméra en fonction de l'angle
  const radius = cameraOffset.length();
  const x = Math.sin(game.cameraAngle) * radius;
  const z = Math.cos(game.cameraAngle) * radius;
  
  // Mettre à jour la position de la caméra
  camera.position.set(
    ballPosition.x + x,
    ballPosition.y + cameraOffset.y,
    ballPosition.z + z
  );
  
  // Faire regarder la caméra vers la balle (+ ball en bas de l'ecran)
  camera.lookAt(new THREE.Vector3(ballPosition.x, ballPosition.y + cameraOffset.y, ballPosition.z));
}

// Ajouter après la création du renderer
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersectPoint = new THREE.Vector3();

function getMousePosition(event: MouseEvent): THREE.Vector3 {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectPoint);
  return intersectPoint;
}

renderer.domElement.addEventListener('mousedown', (event) => {
  const position = getMousePosition(event);
  game.handleMouseDown(position, event.clientX);
});

renderer.domElement.addEventListener('mousemove', (event) => {
  const position = getMousePosition(event);
  game.handleMouseMove(position, event.clientX);
});

renderer.domElement.addEventListener('mouseup', () => {
  game.handleMouseUp();
});

// After the renderer is created
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Après la création du renderer
const touchControls = new TouchControls();
if ('ontouchstart' in window) {
  touchControls.show();
} else {
  touchControls.hide();
}

// Après la création du renderer
OrientationManager.getInstance();

// Après la création du renderer
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Convertir les événements tactiles en événements souris
function touchToMouse(touch: Touch): { clientX: number, clientY: number } {
  return {
    clientX: touch.clientX,
    clientY: touch.clientY
  };
}

// Gestionnaires d'événements tactiles
renderer.domElement.addEventListener('touchstart', (event) => {
  event.preventDefault();
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    const mouseEvent = touchToMouse(touch);
    const position = getMousePosition(mouseEvent as MouseEvent);
    game.handleMouseDown(position, mouseEvent.clientX);
  }
}, { passive: false });

renderer.domElement.addEventListener('touchmove', (event) => {
  event.preventDefault();
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    const mouseEvent = touchToMouse(touch);
    const position = getMousePosition(mouseEvent as MouseEvent);
    game.handleMouseMove(position, mouseEvent.clientX);
  }
}, { passive: false });

renderer.domElement.addEventListener('touchend', (event) => {
  event.preventDefault();
  game.handleMouseUp();
}, { passive: false });
