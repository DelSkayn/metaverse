const THREE = require("three");
const { EventEmitter } = require("metaverse-common");
const Q = require("q");
const { Sky } = require("./sky");

class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(
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
    var material = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      roughness: 0.01
    });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
    this.camera.position.z = 5;
    this.hemisphereLight = new THREE.HemisphereLight(0xe6f5f7, 0x080820, 0.5);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);

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

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get camera() {
    return this._camera;
  }
}

module.exports = {
  Renderer
};
