const Q = require("q");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");
const { ControlsContext, Controls, BaseControls } = require("./controls");
const { Vector3, Quaternion, Euler, Object3D } = require("three");
const { Servers } = require("./servers");
const { Camera } = require("./camera");

let renderer;
let servers;
let mainCamera;
async function init() {
  /// the position of client and its rotation
  mainCamera = new Camera();
  // the render engine
  const baseControls = new BaseControls(null, mainCamera);

  renderer = new Renderer();
  /// context for handleing controls
  const controlsContext = new ControlsContext(baseControls, renderer);
  /// all the servers
  servers = new Servers(controlsContext);
  /// I hate myself
  controlsContext.servers = servers;

  // the base controls, used when no server has bound controls.

  let shouldRender = true;

  let frames = 0;

  function mainLoop() {
    frames += 1;
    // Run the base controlls bindings.
    servers.updatePosition(mainCamera);
    baseControls.tick();

    if (mainCamera.position.y < 1) {
      mainCamera.position.y = 1;
    }

    // update the scene of the connected server.
    servers.tick(mainCamera);

    // Update camera position and rotation
    renderer.camera.quaternion.copy(mainCamera.rotation);
    renderer.camera.position.copy(mainCamera.position);

    if (shouldRender) {
      servers.render(renderer);
    }
    // Render the scene
    requestAnimationFrame(mainLoop);
  }

  function startPositionUi() {
    const position_thingy = document.getElementById("position");
    const updateThingy = () => {
      const pos = mainCamera.position.clone();
      pos.multiplyScalar(0.1);
      pos.round();
      const n = pos.toArray().toString();
      if (n != position_thingy.innerText) {
        position_thingy.innerText = n;
      }
      setTimeout(updateThingy, 500);
    };
    updateThingy();
  }

  function startFpsUi() {
    const fpsUi = document.getElementById("fps");
    const updateThingy = () => {
      fpsUi.innerText = frames;
      frames = 0;
      setTimeout(updateThingy, 1000);
    };
    updateThingy();
  }

  function serverUi() {
    const serverUi = document.getElementById("server");
    const updateThingy = () => {
      let serverText = "disconnected";
      if (servers.current) {
        serverText = servers.current.server.addr;
      }
      if (serverUi.innerText != serverText) {
        serverUi.innerText = serverText;
      }
      setTimeout(updateThingy, 500);
    };
    updateThingy();
  }
  serverUi();

  // Initialize renderer
  let serversPromise = servers.load(mainCamera);

  // Create connections to all the given servers.

  /// Setup control grabber
  const grabber = document.getElementById("grabber");
  grabber.addEventListener("click", () => {
    controlsContext.lock();
  });

  controlsContext.on("lock", () => {
    grabber.style.display = "none";
    shouldRender = true;
  });

  controlsContext.on("unlock", () => {
    grabber.style.display = "";
    shouldRender = false;
  });

  startPositionUi();
  startFpsUi();

  await serversPromise;
  /// start running.
  mainLoop();
  shouldRender = false;
}

document.addEventListener("DOMContentLoaded", init);
