const Q = require("q");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");
const { ControlsContext, Controls } = require("./controls");
const { Vector3, Quaternion, Euler, Object3D } = require("three");
const { Servers } = require("./servers");
const { Camera } = require("./camera");

async function init() {
  // the render engine
  const renderer = new Renderer();
  /// context for handleing controls
  const controlsContext = new ControlsContext(renderer);
  /// all the servers
  const servers = new Servers(controlsContext);

  /// the position of client and its rotation
  let mainCamera = new Camera();

  // the base controls, used when no server has bound controls.
  let baseControls;

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

  // Bind the default controls
  function buildControls() {
    let controls = new Controls();
    controls.on("action:left", () => {
      const other_vec = new Vector3(-1, 0, 0);
      other_vec.applyQuaternion(mainCamera.rotation);
      mainCamera.position.addScaledVector(other_vec, 0.1);
    });
    controls.on("action:right", () => {
      const other_vec = new Vector3(1, 0, 0);
      other_vec.applyQuaternion(mainCamera.rotation);
      mainCamera.position.addScaledVector(other_vec, 0.1);
    });
    controls.on("action:forward", () => {
      const other_vec = new Vector3(0, 0, -1);
      other_vec.applyQuaternion(mainCamera.rotation);
      mainCamera.position.addScaledVector(other_vec, 0.1);
    });
    controls.on("action:backward", () => {
      const other_vec = new Vector3(0, 0, 1);
      other_vec.applyQuaternion(mainCamera.rotation);
      mainCamera.position.addScaledVector(other_vec, 0.1);
    });
    controls.on("action:up", () => {
      mainCamera.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
    });
    controls.on("action:down", () => {
      mainCamera.position.addScaledVector(new Vector3(0, -1, 0), 0.1);
    });
    controls.on("mousemove", x => {
      let euler = new Euler(0, 0, 0, "YXZ");
      euler.setFromQuaternion(mainCamera.rotation);
      euler.y -= x.x * 0.004;
      euler.x -= x.y * 0.004;
      if (euler.x > Math.PI * 0.5) {
        euler.x = Math.PI * 0.5;
      }
      if (euler.x < Math.PI * -0.5) {
        euler.x = Math.PI * -0.5;
      }
      mainCamera.rotation.setFromEuler(euler);
    });
    return controls;
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

  // Initialize renderer
  let serversPromise = servers.load(mainCamera);

  // Create connections to all the given servers.

  /// Create the controls manager
  const lock = new ControlsContext(renderer);

  /// Setup control grabber
  const grabber = document.getElementById("grabber");
  grabber.addEventListener("click", () => {
    lock.lock();
  });

  lock.on("lock", () => {
    grabber.style.display = "none";
    shouldRender = true;
  });

  lock.on("unlock", () => {
    grabber.style.display = "";
    shouldRender = false;
  });
  baseControls = buildControls();
  lock.bind(baseControls);

  startPositionUi();
  startFpsUi();

  await serversPromise;
  /// start running.
  mainLoop();
  shouldRender = false;
}

document.addEventListener("DOMContentLoaded", init);
