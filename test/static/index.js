const { Euler, Vector3 } = THREE;

function buildControls() {
  console.log("bla");
  let controls = new Controls();
  controls.on("action:left", () => {
    const other_vec = new Vector3(1, 0, 0);
    other_vec.applyQuaternion(scene.camera.rotation);
    scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:right", () => {
    const other_vec = new Vector3(-1, 0, 0);
    other_vec.applyQuaternion(scene.camera.rotation);
    scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:forward", () => {
    const other_vec = new Vector3(0, 0, -1);
    other_vec.applyQuaternion(scene.camera.rotation);
    scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:backward", () => {
    const other_vec = new Vector3(0, 0, 1);
    other_vec.applyQuaternion(scene.camera.rotation);
    scene.camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("action:up", () => {
    scene.camera.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
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
  return controls;
}

(async () => {
  const controls = buildControls();
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
  scene.on("disconnect", () => {
    console.log("connection to server lost");
  });

  scene.on("tick", () => {
    controls.tick();
  });

  const three = scene.three;
  console.log(three);
  var loader = new three.GLTFLoader();

  loader.load("http://" + url + "/res/sponza/Sponza.glb", gltf => {
    const tmp = gltf.scene.children[0];
    tmp.castShadow = true;
    tmp.receiveShadow = true;
    for (let i = 0; i < tmp.children.length; i++) {
      tmp.children[i].castShadow = true;
      tmp.children[i].receiveShadow = true;
      tmp.children[i].material.wireframe = true;
    }
    gltf.scene.receiveShadow = true;
    gltf.scene.castShadow = true;
    scene.root = gltf.scene;
    scene.root.position.set(0, 0.01, -3);
    console.log(gltf);
    loader.load("http://" + url + "/res/DamagedHelmet.gltf", gltf => {
      console.log(gltf);
      gltf.scene.children[0].receiveShadow = true;
      gltf.scene.position.setY(3);
      gltf.scene.position.setX(30);
      scene.root.add(gltf.scene);
    });
  });
})();
