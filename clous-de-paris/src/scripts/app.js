import 'styles/index.scss';
import {radians, distance, distanceSqrd, hexToRgbTreeJs, meshPos} from './helpers';
import ClouDeParis from "./elements/clou-de.paris";

export default class App {
  setup() {
    this.gui = new dat.GUI();

    this.ortho = true;

    this.colors = {
      bg: '#000000',
      mesh: '#ffffff',
      rect: '#004f24',
      ambient: '#225b60',
      spot: '#ffffff'
    };

    this.smoothTime = 0.8;
    this.effectDistance = 100;

    this.raycaster = new THREE.Raycaster();

    this.gutter = {size: -0.1};
    this.meshes = [];
    this.meshPositions = [];
    this.grid = {cols: 120, rows: 60};
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse3D = new THREE.Vector2();
    this.repulsion = 1;
    this.geometry = new ClouDeParis();

    const gui = this.gui.addFolder('Background');

    gui.addColor(this.colors, 'bg').onChange((color) => {
      document.body.style.backgroundColor = color;
      this.renderer.setClearColor(color);
    });

    window.addEventListener('resize', this.onResize.bind(this), {passive: true});

    window.addEventListener('mousemove', this.onMouseMove.bind(this), {passive: true});

    this.onMouseMove({clientX: 0, clientY: 0});
  }

  createScene() {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setClearColor(this.colors.bg);

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = this.ortho
      ? new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000)
      : this.camera = new THREE.PerspectiveCamera(45, width / height, 1);
    this.camera.position.set(0, 30, 0);
    this.camera.zoom = this.ortho ? 20 : 1;

    this.scene.add(this.camera);
  }

  addAmbientLight() {
    const l1 = new THREE.AmbientLight(this.colors.ambient, 1);
    const l2 = this.createPointLight(this.colors.ambient, {x: -40, y: 10, z: -30});
    const l3 = this.createPointLight(this.colors.ambient, {x: 40, y: 10, z: 30});

    this.scene.add(l1);
    this.scene.add(l2);
    this.scene.add(l3);


    const gui = this.gui.addFolder('Ambient Light');

    gui.addColor(this.colors, 'ambient').onChange((color) => {
      l1.color = hexToRgbTreeJs(color);
      l2.color = hexToRgbTreeJs(color);
      l3.color = hexToRgbTreeJs(color);
    });
  }

  addSpotLight() {
    this.spotLight = new THREE.SpotLight(this.colors.spot);

    this.spotLight.position.set(0, 27, 0);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 2048;
    this.spotLight.shadow.mapSize.height = 2048;
    this.spotLight.shadow.camera.near = this.camera.near;
    this.spotLight.shadow.camera.far = this.camera.far;
    this.spotLight.angle = radians(20);
    this.spotLight.penumbra = 0.5;
    this.spotLight.intensity = 2;
    this.spotLight.decay = 0;
    this.spotLight.distance = 1000;
    this.spotLight.target.position.set(0, 0, 0)

    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    const gui = this.gui.addFolder('Spot Light');

    gui.addColor(this.colors, 'spot').onChange((color) => {
      this.spotLight.color = hexToRgbTreeJs(color);
    });

    gui.add(this.spotLight, 'angle', 1, 90, 1).onChange((angle) => {
      this.spotLight.angle = radians(angle);
    });
  }

  addRectLight() {
    const rectLight = new THREE.RectAreaLight(this.colors.rect, 1, 2000, 2000);

    rectLight.position.set(5, 50, 50);
    rectLight.lookAt(0, 0, 0);

    this.scene.add(rectLight);

    const gui = this.gui.addFolder('Rect Light');

    gui.addColor(this.colors, 'rect').onChange((color) => {
      rectLight.color = hexToRgbTreeJs(color);
    });
  }

  createPointLight(color, position) {
    const pointLight = new THREE.PointLight(color, 1, 1000, 1);
    pointLight.position.set(position.x, position.y, position.z);
    pointLight.distance = 1000;

    return pointLight;
  }

  createGrid() {
    this.groupMesh = new THREE.Object3D();

    const meshParams = {
      color: this.colors.mesh,
      metalness: .7,
      emissive: '#000',
      roughness: .2,
    };

    const material = new THREE.MeshPhysicalMaterial(meshParams);
    const gui = this.gui.addFolder('Mesh Material');

    gui.addColor(meshParams, 'color').onChange((color) => {
      material.color = hexToRgbTreeJs(color);
    });
    gui.add(meshParams, 'metalness', 0.1, 1).onChange((val) => {
      material.metalness = val;
    });
    gui.add(meshParams, 'roughness', 0.1, 1).onChange((val) => {
      material.roughness = val;
    });

    for (let row = 0; row < this.grid.rows; row++) {
      this.meshes[row] = [];
      this.meshPositions[row] = [];

      for (let col = 0; col < this.grid.cols; col++) {
        const mesh = this.getMesh(this.geometry.geom, material);

        const refPos = meshPos(row, col, this.gutter.size);

        mesh.geometry.computeBoundingBox();
        mesh.geometry.center();
        mesh.position.set(refPos);
        mesh.rotation.x = this.geometry.rotationX;
        mesh.rotation.y = this.geometry.rotationY;
        mesh.rotation.z = this.geometry.rotationZ;

        mesh.initialRotation = {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z,
        };

        this.groupMesh.add(mesh);
        this.meshes[row][col] = mesh;
        this.meshPositions[row][col] = refPos;
      }
    }

    const centerX = ((this.grid.cols - 1) + ((this.grid.cols - 1) * this.gutter.size)) * .5;
    const centerZ = ((this.grid.rows - 1) + ((this.grid.rows - 1) * this.gutter.size)) * .5;

    this.groupMesh.position.set(-centerX, 0, -centerZ);

    this.scene.add(this.groupMesh);


    const gui2 = this.gui.addFolder('Magnetic Effect');
    gui2.add(this, 'effectDistance', 10, 200, 1).onChange((distance) => {
      this.effectDistance = distance;
    });

    gui2.add(this, 'smoothTime', 0, 2, 0.1).onChange((time) => {
      this.smoothTime = time;
    });
  }

  getMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  }

  addFloor() {
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.ShadowMaterial({opacity: .3});

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.y = 0;
    this.floor.rotateX(-Math.PI / 2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  init() {
    this.setup();

    this.createScene();

    this.createCamera();

    this.addAmbientLight();

    this.addSpotLight();

    this.addRectLight();

    this.createGrid();


    this.addCameraControls();

    this.addFloor();

    this.animate();
  }

  onMouseMove({clientX, clientY}) {
    this.mouse3D.x = (clientX / this.width) * 2 - 1;
    this.mouse3D.y = -(clientY / this.height) * 2 + 1;
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  draw() {
    this.raycaster.setFromCamera(this.mouse3D, this.camera);

    const intersects = this.raycaster.intersectObjects([this.floor]);

    if (intersects.length) {

      const target = {
        x: intersects[0].point.x,
        y: 0,
        z: intersects[0].point.z,
      };

      const light = {
        x: intersects[0].point.x,
        y: this.spotLight.position.y,
        z: intersects[0].point.z,
      };

      TweenMax.to(this.spotLight.position, this.smoothTime, light);
      TweenMax.to(this.spotLight.target.position, this.smoothTime, target);

      let dir = new THREE.Vector3();

      for (let row = 0; row < this.grid.rows; row++) {
        for (let col = 0; col < this.grid.cols; col++) {

          const mesh = this.meshes[row][col];
          const refPos = this.meshPositions[row][col];
          const currentPos = {
            x: refPos.x + this.groupMesh.position.x,
            y: refPos.y,
            z: refPos.z + this.groupMesh.position.z
          };

          dir.subVectors(currentPos, target).normalize();
          const mouseDistance = distance(
            target.x,
            target.z,
            currentPos.x,
            currentPos.z);

          // const factor = 1 / (1 + Math.abs(mouseDistance));
          const factor = THREE.MathUtils.clamp(1 - (Math.abs(mouseDistance) / this.effectDistance), 0, 1);

          const offset = (1 - factor);

          const pos = {
            x: refPos.x - dir.x * offset,
            y: refPos.y + factor,
            z: refPos.z - dir.z * offset
          };

          /*
          mesh.position.set(pos);
          mesh.scale.set(scale, scale, scale);
          */

          TweenMax.to(mesh.position, this.smoothTime, pos);

          TweenMax.to(mesh.scale, this.smoothTime, {
            x: 1 + 0.4 * factor,
            y: 1 + 2 * factor,
            z: 1 + 0.4 * factor,
          });
        }
      }
    }
  }

  animate() {
    this.controls.update();

    this.draw();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }
}
