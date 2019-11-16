const { Vector3, Quaternion } = require("three");

class Camera {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
  }

  copy(other) {
    this.position.copy(other.position);
    this.rotation.copy(other.rotation);
  }
}

module.exports = {
  Camera
};
