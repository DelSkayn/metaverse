const { Vector3, Quaternion } = require("three");

function toChunkPosition(vec) {
  const res = vec.clone();
  res.multiplyScalar(0.1);
  res.floor();
  return res;
}

class Camera {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
  }
}

module.exports = {
  Camera,
  toChunkPosition
};
