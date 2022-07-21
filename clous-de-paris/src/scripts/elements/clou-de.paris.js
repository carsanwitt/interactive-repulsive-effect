import { radians } from '../helpers';

// 4 sided pyramid
export default class ClouDeParis {
  constructor() {
    this.geom = new THREE.ConeBufferGeometry(.4, .6, 4);
    this.rotationX = 0;
    this.rotationY = radians(45);
    this.rotationZ = 0;
  }
}
