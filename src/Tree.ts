import * as THREE from 'three';

export class Tree {
  mesh: THREE.Group;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();

    // Tronc plus petit
    const trunkGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2800 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.1;

    // Feuillage plus petit
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x0d5c0d });
    const coneGeometry = new THREE.ConeGeometry(0.1, 0.15, 8);
    
    const cone1 = new THREE.Mesh(coneGeometry, leafMaterial);
    cone1.position.y = 0.23;
    
    const cone2 = new THREE.Mesh(coneGeometry, leafMaterial);
    cone2.position.y = 0.3;
    cone2.scale.setScalar(0.8);
    
    const cone3 = new THREE.Mesh(coneGeometry, leafMaterial);
    cone3.position.y = 0.37;
    cone3.scale.setScalar(0.6);

    this.mesh.add(trunk, cone1, cone2, cone3);
    this.mesh.position.copy(position);

    // Ajouter des ombres
    trunk.castShadow = true;
    cone1.castShadow = true;
    cone2.castShadow = true;
    cone3.castShadow = true;
  }
} 