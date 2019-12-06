const { THREE, Camera, BaseControls, Controls, scene, url, userName } = this;
const { Euler, Vector3, Object3D } = THREE;

const root = new Object3D();
let t = 0;
(async () => {
  let flipperGeom = new THREE.BoxGeometry(1, 1, 1);
  let flipperMat1 = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.53,
    color: 0xff0000
  });

  flipper1 = new THREE.Mesh(flipperGeom, flipperMat1);
  root.add(flipper1);
  scene.root = root;
  scene.root.position.setZ(15);
  scene.root.position.setX(5);
  scene.root.position.setY(5);

  scene.on("tick", () => {
    t += 0.02;
    flipper1.position.setZ(Math.sin(t) * 10);
  });
})();
