(async () => {
  const chunks = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 }
  ];
  scene.on("connect", async rpc => {
    console.log("recieved connection to server!");
    await rpc.remote.log("Hallo from the client!");
    await rpc.remote.log("Hallo from the client again!");
  });
  scene.on("disconnect", () => {
    console.log("connection to server lost");
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
