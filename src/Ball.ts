import * as THREE from 'three';

export class Ball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3 = new THREE.Vector3();
  acceleration: THREE.Vector3 = new THREE.Vector3();
  mass: number = 0.045;
  friction: number = 0.99;
  wind: THREE.Vector3 = new THREE.Vector3();

  constructor(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.021, 32, 32);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      '/textures/golfball2.jpg',
      (t) => {
        console.log('✅ Texture loaded:', t);
      },
      undefined,
      (err) => {
        console.error('❌ Texture failed to load:', err);
      }
    );
    // console.log("texture",texture.name);
    const material = new THREE.MeshStandardMaterial({
      map: texture,            // your texture
      roughness: 0.4,
      metalness: 0.0,          // adjust as needed
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
  }

  applyForce(force: THREE.Vector3) {
    const f = force.clone().divideScalar(this.mass);
    this.acceleration.add(f);
  }

  update(delta: number) {
    this.applyForce(this.wind);
    this.velocity.add(this.acceleration.multiplyScalar(delta));
    this.velocity.multiplyScalar(this.friction);
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
    this.acceleration.set(0, 0, 0);

    if (this.mesh.position.y < 0.021) {
      this.mesh.position.y = 0.021;
      this.velocity.y = -this.velocity.y * 0.3;
    }
  }
}
