const { Vector3, Quaternion } = require("three");

class Camera {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
  }
}

module.exports = {
  Camera
};
