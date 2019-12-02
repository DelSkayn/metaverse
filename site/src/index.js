const { Renderer } = require("./renderer");
const { Camera } = require("./camera");
const { Servers } = require("./servers");
const { ControlManager } = require("./controls");

async function init() {
  const renderer = new Renderer();

  const mainCamera = new Camera();

  const servers = new Servers();
  servers.load(mainCamera.position);

  async function mainLoop() {
    if (mainCamera.position.y < 1) {
      mainCamera.position.setY(1);
    }
    renderer.camera.quaternion.copy(mainCamera.rotation);
    renderer.camera.position.copy(mainCamera.position);
    renderer.render();
    requestAnimationFrame(mainLoop);
  }
  mainLoop();
}

document.addEventListener("DOMContentLoaded", init);
