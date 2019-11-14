const Q = require("q");
const { ServerConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");
const { ControlsContext, Controls } = require("./controls");
const { Vector3, Quaternion, Euler, Object3D } = require("three");

/// all the servers
let servers;
/// all connections to the servers
let connections = [];
/// the connection to the server whose space where currently in.
let currentConnection = null;

let last_chunk = new Vector3();

/// the position of client and its rotation
let transform = {
  position: new Vector3(0, 2, 0),
  rotation: new Quaternion()
};

// the render engine
let renderer;

// the base controls, used when no server has bound controls.
let baseControls;

let roots = new Object3D();
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
    transform.rotation.setFromEuler(euler);
  });
  return controls;
}

async function init() {
  // Initialize renderer
  renderer = new Renderer();
  // Retreive initial server info.
  const roundedPosition = new Vector3();
  roundedPosition.copy(transform.position);
  roundedPosition.round();
  servers = getServers(roundedPosition);

  // Create connections to all the given servers.
  for (let i = 0; i < servers.length; i++) {
    connections.push(new ServerConnection(servers[i]));
  }

  // Load initial script
  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];
    connections[i]
      .load()
      .then(() => {
        // If this server is the one the client is in
        // connect to the server;
        if (server.isWithin(transform.position)) {
          currentConnection = connections[i];
          currentConnection.connect();
        }
      })
      .catch(x => {
        console.error("Failed to fetch index from server: " + x);
      });
  }

  /// Create the controls manager
  const lock = new ControlsContext(renderer);

  /// Setup control grabber
  const grabber = document.getElementById("grabber");
  grabber.addEventListener("click", () => {
    lock.lock();
  });

  lock.on("lock", () => {
    grabber.style.display = "none";
  });

  lock.on("unlock", () => {
    grabber.style.display = "";
  });
  baseControls = buildControls();
  lock.bind(baseControls);

  const position_thingy = document.getElementById("position");
  const updateThingy = () => {
    const pos = transform.position.clone();
    pos.round();
    position_thingy.innerText = pos.toArray().toString();
    setTimeout(updateThingy, 500);
  };
  updateThingy();

  /// start running.
  mainLoop();
}

function mainLoop() {
  // Run the base controlls bindings.
  baseControls.tick();

  // Update camera position and rotation
  renderer.camera.quaternion.copy(transform.rotation);
  renderer.camera.position.copy(transform.position);

  for (let i = 0; i < connections.length; i++) {
    if (connections[i].scene.root) {
      renderer.roots.add(connections[i].scene.root);
    }
  }

  if (currentConnection) {
    // update the scene of the connected server.
    let scene = currentConnection.scene;
    scene.tick();
  }

  if (transform.position.y < 1) {
    transform.position.y = 1;
  }
  // Render the scene
  renderer.render();
  for (let i = 0; i < connections.length; i++) {
    if (connections[i].scene.root) {
      renderer.roots.remove(connections[i].scene.root);
    }
  }
  requestAnimationFrame(this.mainLoop);
}

document.addEventListener("DOMContentLoaded", init);
