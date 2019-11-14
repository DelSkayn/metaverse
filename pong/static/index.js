(async () => {
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
