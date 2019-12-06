const { Euler, Vector3 } = this.THREE;
const { GLTFLoader, THREE, Controls, Camera, scene } = this;

this.showLetter = function(letter) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = "300px Arial";
  const metrics = ctx.measureText(letter);
  ctx.canvas.width = metrics.width;
  ctx.canvas.height = 300;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#FF0000";
  ctx.font = "300px Arial";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.fillText(letter, 0, 260);
  ctx.strokeText(letter, 0, 260);
  const text = new THREE.CanvasTexture(ctx.canvas);
  const mat = new THREE.SpriteMaterial({ map: text, color: 0xff0000 });

  let scale = new THREE.Vector2(metrics.width, 300);
  scale.normalize();
  scale.multiplyScalar(10);
  const res = new THREE.Sprite(mat);
  //const res = new THREE.Mesh(geom, mat);
  res.scale.set(scale.x, scale.y, 1);
  //res.position.setY(1.2);
  return res;
};

(async () => {
  this.scene.root = new THREE.Object3D();
  scene.camera = new Camera();
  var letterdisplayed = this.showLetter("M");
  letterdisplayed.position.set(-5, 5, -25);
  this.scene.root.add(letterdisplayed);
})();
