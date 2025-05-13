export class OrientationManager {
  private static instance: OrientationManager;
  private orientationElement: HTMLDivElement | null = null;

  private constructor() {
    this.createOrientationMessage();
    this.checkOrientation();
    window.addEventListener('resize', () => this.checkOrientation());
  }

  static getInstance(): OrientationManager {
    if (!OrientationManager.instance) {
      OrientationManager.instance = new OrientationManager();
    }
    return OrientationManager.instance;
  }

  private createOrientationMessage() {
    this.orientationElement = document.createElement('div');
    this.orientationElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000;
      color: #fff;
      display: none;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    this.orientationElement.innerHTML = 'Veuillez tourner votre appareil en mode paysage';
    document.body.appendChild(this.orientationElement);
  }

  private checkOrientation() {
    if (this.orientationElement) {
      if (window.innerHeight < window.innerWidth) {
        this.orientationElement.style.display = 'flex';
        this.orientationElement.innerHTML = 'Veuillez tourner votre appareil en mode portrait';
      } else {
        this.orientationElement.style.display = 'none';
      }
    }
  }
} 