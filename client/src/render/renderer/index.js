const THREE = require("three");
const Q = require("q");
const { Sky } = require("./sky");

class ControlsLock extends EventTarget {
  constructor(renderer) {
    super();

    document.addEventListener(
      "pointerlockchange",
      this._onPointerLockChange.bind(this),
      false
    );
    document.addEventListener(
      "pointerlockerror",
      this._onPointerLockError.bind(this),
      false
    );

    this.canvas = renderer.renderer.domElement;
  }

  _onPointerLockError() {
    console.error("Unable to lock pointer");
    this.dispatchEvent("error");
  }

  _onPointerLockChange() {
    if (document.pointerLockElement === this.canvas) {
      let event = new CustomEvent("lock");
      console.log(event);
      this.dispatchEvent(event);
    } else {
      let event = new CustomEvent("unlock");
      console.log(event);
      this.dispatchEvent(event);
    }
  }

  lock() {
    this.canvas.requestPointerLock();
  }

  unlock() {
    document.exitPointerLock();
  }
}

class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.append(this.renderer.domElement);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
    this.camera.position.z = 5;
    this.hemisphereLight = new THREE.HemisphereLight(0xe6f5f7, 0x080820, 0.5);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 10);

    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    let uniforms = this.sky.material.uniforms;
    uniforms["turbidity"].value = 10;
    uniforms["rayleigh"].value = 2;
    uniforms["mieCoefficient"].value = 0.005;
    uniforms["mieDirectionalG"].value = 0.8;
    uniforms["luminance"].value = 1;

    var distance = 400000;
    var theta = Math.PI * (0.44 - 0.5);
    var phi = 2 * Math.PI * (0.24 - 0.5);
    let position = new THREE.Vector3();
    position.x = distance * Math.cos(phi);
    position.y = distance * Math.sin(phi) * Math.sin(theta);
    position.z = distance * Math.sin(phi) * Math.cos(theta);
    console.log(position);
    this.sunLight.position.set(position.divideScalar(distance));
    this.sunLight.target = this.cube;
    uniforms["sunPosition"].value.copy(position);

    this.scene.add(this.sunLight);
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.sky);

    window.addEventListener(
      "resize",
      (() => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }).bind(this),
      false
    );
  }

  start() {
    this._animate();
  }

  _animate() {
    this.cube.rotation.x += 0.02;
    this.cube.rotation.y += 0.02;
    requestAnimationFrame(this._animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

module.exports = {
  Renderer,
  ControlsLock
};
