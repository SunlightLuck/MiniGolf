import * as THREE from 'three';

export class TouchControls {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      z-index: 100;
    `;

    this.createHelpText();
    document.body.appendChild(this.container);
  }

  private createHelpText() {
    const helpText = document.createElement('div');
    helpText.style.cssText = `
      color: white;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      text-align: center;
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 300px;
    `;
    helpText.innerHTML = 'Tapez et glissez pour viser<br>Relâchez pour tirer';
    document.body.appendChild(helpText);
  }

  show() {
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
  }
} 