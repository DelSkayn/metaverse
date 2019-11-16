const THREE = require("three");
const { EventEmitter } = require("metaverse-common");
const Q = require("q");
const { Sky } = require("./sky");
const DevTexture = require("./dev_texture");

function buildGround(texture) {
  const ground_mesh = new THREE.PlaneGeometry(1000, 1000, 100, 100);
  const text = new THREE.TextureLoader().load(DevTexture);
  text.repeat.set(1000, 1000);
  text.wrapS = THREE.RepeatWrapping;
  text.wrapT = THREE.RepeatWrapping;

  for (let i = 0; i < ground_mesh.vertices.length; i++) {
    ground_mesh.vertices[i].z = ground_mesh.vertices[i].y;
    ground_mesh.vertices[i].y = 0;
  }
  ground_mesh.computeVertexNormals();

  const ground_material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: text,
    roughness: 0.9,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(ground_mesh, ground_material);
}

class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.roots = new Object3D();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    document.body.append(this.renderer.domElement);

    this.camera.position.z = 5;
    this.hemisphereLight = new THREE.HemisphereLight(0xe6f5f7, 0x080820, 0.2);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.color.setHSL(0.1, 1, 0.95);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    var d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.bias = -0.0001;

    // Setup sky
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    let uniforms = this.sky.material.uniforms;
    uniforms["turbidity"].value = 10;
    uniforms["rayleigh"].value = 2;
    uniforms["mieCoefficient"].value = 0.005;
    uniforms["mieDirectionalG"].value = 0.8;
    uniforms["luminance"].value = 1;
    var distance = 400000;
    var theta = Math.PI * (0.05 - 0.5);
    var phi = 2 * Math.PI * (0.25 - 0.5);
    let position = new THREE.Vector3();
    position.x = distance * Math.cos(phi);
    position.y = distance * Math.sin(phi) * Math.sin(theta);
    position.z = distance * Math.sin(phi) * Math.cos(theta);

    this.sunLight.position.copy(position);
    this.sunLight.position.normalize();
    this.sunLight.position.multiplyScalar(50);
    uniforms["sunPosition"].value.copy(position);
    this.devTexture = new THREE.TextureLoader().load(DevTexture);
    this.ground = buildGround(this.devTexture);
    this.ground.receiveShadow = true;

    // Add things to a scene
    this.scene.add(this.sunLight);
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.sky);
    this.scene.add(this.ground);
    this.scene.add(this.roots);

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
    const ground_pos = this.camera.position.clone();
    ground_pos.round();
    ground_pos.setY(0);
    this.ground.position.copy(ground_pos);
    this.renderer.render(this.scene, this.camera);
  }

  get camera() {
    return this._camera;
  }
}

module.exports = {
  Renderer
};
