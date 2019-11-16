const Q = require("q");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");
const { ControlsContext, Controls } = require("./controls");
const { Vector3, Quaternion, Euler, Object3D } = require("three");
const { Servers } = require("./servers");

/// all the servers
let servers = new Servers();

/// the position of client and its rotation
let transform = {
  position: new Vector3(0, 2, 0),
  rotation: new Quaternion()
};

// the render engine
let renderer;

// the base controls, used when no server has bound controls.
let baseControls;

let shouldRender = true;

let frames = 0;

// Bind the default controls
function buildControls() {
  let controls = new Controls();
  controls.on("left", () => {
    const other_vec = new Vector3(-1, 0, 0);
    other_vec.applyQuaternion(transform.rotation);
    transform.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("right", () => {
    const other_vec = new Vector3(1, 0, 0);
    other_vec.applyQuaternion(transform.rotation);
    transform.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("forward", () => {
    const other_vec = new Vector3(0, 0, -1);
    other_vec.applyQuaternion(transform.rotation);
    transform.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("backward", () => {
    const other_vec = new Vector3(0, 0, 1);
    other_vec.applyQuaternion(transform.rotation);
    transform.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("up", () => {
    transform.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
  });
  controls.on("down", () => {
    transform.position.addScaledVector(new Vector3(0, -1, 0), 0.1);
  });
  controls.on("mousemove", x => {
    let euler = new Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(transform.rotation);
    euler.y -= x.x * 0.004;
    euler.x -= x.y * 0.004;
    if (euler.x > Math.PI * 0.5) {
      euler.x = Math.PI * 0.5;
    }
    if (euler.x < Math.PI * -0.5) {
      euler.x = Math.PI * -0.5;
    }
    transform.rotation.setFromEuler(euler);
  });
  return controls;
}

function startPositionUI() {
  const position_thingy = document.getElementById("position");
  const updateThingy = () => {
    const pos = transform.position.clone();
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

async function init() {
  // Initialize renderer
  let serversPromise = servers.load(transform.position);
  renderer = new Renderer();

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

  startPositionUI();
  startFpsUi();

  await serversPromise;
  /// start running.
  mainLoop();
  shouldRender = false;
}

function mainLoop() {
  frames += 1;
  // Run the base controlls bindings.
  servers.updatePosition(transform.position);
  baseControls.tick();

  // Update camera position and rotation
  renderer.camera.quaternion.copy(transform.rotation);
  renderer.camera.position.copy(transform.position);

  for (let i = 0; i < servers.all.length; i++) {
    if (servers.all[i].scene.root) {
      renderer.roots.add(servers.all[i].scene.root);
    }
  }

  // update the scene of the connected server.
  if (servers.current) {
    servers.current.scene.tick();
  }

  if (transform.position.y < 1) {
    transform.position.y = 1;
  }
  // Render the scene
  if (shouldRender) {
    renderer.render();
  }
  for (let i = 0; i < servers.all.length; i++) {
    if (servers.all[i].scene.root) {
      renderer.roots.remove(servers.all[i].scene.root);
    }
  }
  requestAnimationFrame(this.mainLoop);
}

document.addEventListener("DOMContentLoaded", init);
