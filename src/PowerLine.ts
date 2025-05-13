import * as THREE from 'three';

export class PowerLine {
  public line: THREE.Line;
  private powerMeter: THREE.Group;
  private directionIndicator: THREE.Group;
  private maxLength: number = 2;
  private startPoint: THREE.Vector3;
  private endPoint: THREE.Vector3;
  private powerMeterHeight: number = 0.1;
  private powerMeterWidth: number = 0.02;
  private powerMeterColor: THREE.Color = new THREE.Color(0x00ff00);
  private powerMeterMaxColor: THREE.Color = new THREE.Color(0xff0000);

  constructor(scene: THREE.Scene) {
    const points = [
      new THREE.Vector3(0, 0.022, 0),
      new THREE.Vector3(0, 0.022, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    this.line = new THREE.Line(geometry, material);
    this.startPoint = points[0];
    this.endPoint = points[1];
    scene.add(this.line);
    this.line.visible = false;

    // Create power meter
    this.powerMeter = new THREE.Group();
    const meterGeometry = new THREE.BoxGeometry(this.powerMeterWidth, this.powerMeterHeight, 0.01);
    const meterMaterial = new THREE.MeshBasicMaterial({ color: this.powerMeterColor });
    const meter = new THREE.Mesh(meterGeometry, meterMaterial);
    this.powerMeter.add(meter);
    scene.add(this.powerMeter);
    this.powerMeter.visible = false;

    // Create direction indicator
    this.directionIndicator = new THREE.Group();
    const arrowGeometry = new THREE.ConeGeometry(0.02, 0.05, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.x = Math.PI / 2;
    this.directionIndicator.add(arrow);
    scene.add(this.directionIndicator);
    this.directionIndicator.visible = false;
  }

  update(start: THREE.Vector3, end: THREE.Vector3) {
    this.startPoint.copy(start);
    this.startPoint.y = 0.022;
    this.endPoint.copy(end);
    this.endPoint.y = 0.022;
    
    const points = [this.startPoint, this.endPoint];
    this.line.geometry.setFromPoints(points);

    // Update power meter
    const power = Math.min(this.getPower(), 100);
    const powerRatio = power / 100;
    const meter = this.powerMeter.children[0] as THREE.Mesh;
    meter.scale.y = powerRatio;
    meter.position.y = (powerRatio * this.powerMeterHeight) / 2;
    
    // Update power meter color
    const material = meter.material as THREE.MeshBasicMaterial;
    material.color.lerpColors(this.powerMeterColor, this.powerMeterMaxColor, powerRatio);

    // Position power meter
    this.powerMeter.position.copy(start);
    this.powerMeter.position.y += 0.1;

    // Update direction indicator
    const direction = new THREE.Vector3().subVectors(this.startPoint, this.endPoint).normalize();
    this.directionIndicator.position.copy(start);
    this.directionIndicator.position.y += 0.05;
    this.directionIndicator.lookAt(end);
    this.directionIndicator.rotateX(Math.PI / 2);
  }

  show() {
    this.line.visible = true;
    this.powerMeter.visible = true;
    this.directionIndicator.visible = true;
  }

  hide() {
    this.line.visible = false;
    this.powerMeter.visible = false;
    this.directionIndicator.visible = false;
  }

  private getPower(): number {
    return this.startPoint.distanceTo(this.endPoint) * 50;
  }

  getPowerAndDirection(): { direction: THREE.Vector3, power: number } {
    const direction = new THREE.Vector3().subVectors(this.startPoint, this.endPoint);
    const power = Math.min(this.getPower(), 100);
    return { direction, power };
  }
} 