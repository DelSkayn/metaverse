const { Euler, Vector3 } = this.THREE;
const { GLTFLoader, THREE, Controls, Camera, scene } = this;

console.log("HALLOWWOWOW");
console.log(this.scene);

this.showLetter = function(letter) {
  const ctx = document.createElement("canvas").getContext("2d");
  document.body.appendChild(ctx.canvas);
  const metrics = ctx.measureText(letter);
  ctx.canvas.width = metrics.width;
  ctx.canvas.height = 100;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#FF0000";
  ctx.font = "100px Arial";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.fillText(letter, 0, 80);
  ctx.strokeText(letter, 0, 80);
  const text = new THREE.CanvasTexture(ctx.canvas);
  const geom = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.SpriteMaterial({ map: text, color: 0xff0000 });

  let scale = new THREE.Vector2(metrics.width, 100);
  scale.normalize();
  const res = new THREE.Sprite(mat);
  //const res = new THREE.Mesh(geom, mat);
  res.scale.set(scale.x, scale.y, 1);
  //res.position.setY(1.2);
  return res;
};

this.buildControls = function() {
  console.log("HALLOWWOWOW");
  console.log("HALLOWWOWOW");
  console.log("HALLOWWOWOW");
  console.log("HALLOWWOWOW");
  console.log(this);
  let controls = new Controls();
  controls.on("action:left", () => {
    const other_vec = new Vector3(1, 0, 0);
    other_vec.applyQuaternion(this.scene.camera.rotation);
    this.scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:right", () => {
    const other_vec = new Vector3(-1, 0, 0);
    other_vec.applyQuaternion(this.scene.camera.rotation);
    this.scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:forward", () => {
    const other_vec = new Vector3(0, 0, -1);
    other_vec.applyQuaternion(this.scene.camera.rotation);
    this.scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:backward", () => {
    const other_vec = new Vector3(0, 0, 1);
    other_vec.applyQuaternion(this.scene.camera.rotation);
    this.scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:up", () => {
    this.scene.camera.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
  });
  controls.on("action:down", () => {
    scene.camera.position.addScaledVector(new Vector3(0, -1, 0), 0.1);
  });
  controls.on("mousemove", x => {
    let euler = new Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(scene.camera.rotation);
    euler.y -= x.x * 0.004;
    euler.x -= x.y * 0.004;
    if (euler.x > Math.PI * 0.5) {
      euler.x = Math.PI * 0.5;
    }
    if (euler.x < Math.PI * -0.5) {
      euler.x = Math.PI * -0.5;
    }
    scene.camera.rotation.setFromEuler(euler);
  });
  controls.on(
    "mousemove",
    (x => {
      let euler = new Euler(0, 0, 0, "YXZ");
      euler.setFromQuaternion(this.scene.camera.rotation);
      euler.y -= x.x * 0.004;
      euler.x -= x.y * 0.004;
      if (euler.x > Math.PI * 0.5) {
        euler.x = Math.PI * 0.5;
      }
      if (euler.x < Math.PI * -0.5) {
        euler.x = Math.PI * -0.5;
      }
      this.scene.camera.rotation.setFromEuler(euler);
    }).bind(this)
  );
  return controls;
};
(async () => {
  this.scene.root = new THREE.Object3D();
  const controls = this.buildControls();
  scene.bind(controls);
  console.log(scene);
  const chunks = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 }
  ];
  scene.camera = new Camera();
  scene.on("connect", async rpc => {
    console.log("recieved connection to server!");
    await rpc.remote.log("Hallo from the client!");
    await rpc.remote.log("Hallo from the client again!");
  });

  var letterdisplayed = this.showLetter("M");
  scene.bind(letterdisplayed);
  
  scene.on("disconnect", () => {
    console.log("connection to server lost");
  });

  this.scene.on("tick", () => {
    controls.tick();
  });

})();
