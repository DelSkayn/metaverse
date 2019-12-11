const THREE = require("three");
const { EventEmitter } = require("metaverse-common");
const Q = require("q");
const { Sky } = require("./sky");
const DevTexture = require("./dev_texture");

function fnv(str) {
  const FNV_INIT = 0x811c9dc5;
  let hval = FNV_INIT;
  for (let i = 0; i < str.length; ++i) {
    hval ^= str.charCodeAt(i);
    hval +=
      (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return hval >>> 0;
}

function buildChunkGeom() {
  let chunkGeometry = new THREE.Geometry();
  const positions = [
    [10, 10, 10],
    [10, 0, 10],

    [10, 0, 10],
    [0, 0, 10],

    [0, 0, 10],
    [0, 10, 10],

    [0, 10, 10],
    [10, 10, 10],

    [10, 10, 0],
    [10, 0, 0],

    [10, 0, 0],
    [0, 0, 0],

    [0, 0, 0],
    [0, 10, 0],

    [0, 10, 0],
    [10, 10, 0],

    [10, 10, 0],
    [10, 10, 10],

    [10, 0, 0],
    [10, 0, 10],

    [0, 10, 0],
    [0, 10, 10],

    [0, 0, 0],
    [0, 0, 10]
  ];

  positions.forEach(x => {
    chunkGeometry.vertices.push(new THREE.Vector3(...x));
  });

  return chunkGeometry;
}

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
    this.roots = new THREE.Object3D();
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
    var phi = 2 * Math.PI * (0.26 - 0.5);
    let position = new THREE.Vector3();
    position.x = distance * Math.cos(phi);
    position.y = distance * Math.sin(phi) * Math.sin(theta);
    position.z = distance * Math.sin(phi) * Math.cos(theta);

    this.character = new THREE.Object3D();

    this.sunLight.position.copy(position);
    this.sunLight.position.normalize();
    this.sunLight.position.multiplyScalar(50);
    this.sunLight.target = this.character;
    uniforms["sunPosition"].value.copy(position);
    this.devTexture = new THREE.TextureLoader().load(DevTexture);
    this.ground = buildGround(this.devTexture);
    this.ground.receiveShadow = true;

    this.chunkGeometry = buildChunkGeom();
    this.chunkObject = null;
    this._renderChunks = false;

    // Add things to a scene
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.sky);
    this.scene.add(this.ground);
    this.scene.add(this.roots);
    this.scene.add(this.character);
    this.character.add(this.sunLight);

    this.last_date = new Date(0);
    this._updateSun();

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

  get renderChunks() {
    return this._renderChunks;
  }

  set renderChunks(value) {
    if (value == this._renderChunks) {
      return;
    }
    if (value) {
      this.scene.add(this.chunkObject);
    } else {
      this.scene.remove(this.chunkObject);
    }
    this._renderChunks = value;
  }

  render() {
    this._updateSun();
    const ground_pos = this.camera.position.clone();
    ground_pos.round();
    ground_pos.setY(0);
    this.ground.position.copy(ground_pos);

    this.character.position.copy(this.camera.position);

    this.renderer.render(this.scene, this.camera);
  }

  updateChunks(servers) {
    if (this.chunkObject && this._renderChunks) {
      this.scene.remove(this.chunkObject);
    }
    this.chunksCache = servers;
    this.chunkObject = new THREE.Object3D();
    servers.forEach(x => {
      let vertexColor = fnv(x.addr);
      vertexColor >>> 8;
      let material = new THREE.LineBasicMaterial({ color: vertexColor });
      x.chunks.forEach(chunk => {
        let pos = chunk.clone();
        pos.multiplyScalar(10);
        let obj = new THREE.LineSegments(this.chunkGeometry, material);
        obj.position.copy(pos);
        this.chunkObject.add(obj);
      });
    });
    if (this._renderChunks) {
      this.scene.add(this.chunkObject);
    }
  }

  _updateSun() {
    if (this.last_date.getTime() + 1000 * 60 > Date.now()) {
      return;
    }
    this.last_date = new Date();
    this.current = this.last_date.getHours() / 24;
    this.current += this.last_date.getMinutes() / (60 * 24);
    let intensity = 1;

    if (this.current > 0.9 && this.current <= 1) {
      intensity = (1 - this.current) * 10;
    } else if (this.current > 1) {
      intensity = 0;
    } else if (this.current < 0.1) {
      intensity = this.current * 10;
    }

    this.sunLight.intensity = intensity;

    var distance = 400000;
    var theta = Math.PI * (0.05 - 0.5);
    var phi = 2 * Math.PI * (this.current - 0.75);
    let position = new THREE.Vector3();
    position.x = distance * Math.cos(phi);
    position.y = distance * Math.sin(phi) * Math.sin(theta);
    position.z = distance * Math.sin(phi) * Math.cos(theta);

    this.sunLight.position.copy(position);
    this.sunLight.position.normalize();
    this.sunLight.position.multiplyScalar(50);
    this.sky.material.uniforms["sunPosition"].value.copy(position);
  }

  get camera() {
    return this._camera;
  }
}

module.exports = {
  Renderer
};
