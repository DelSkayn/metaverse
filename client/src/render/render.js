const Q = require("q");
const { ClientConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");
const { ControlsContext, Controls } = require("./controls");
const { Vector3, Quaternion, Euler } = require("three");

let servers;
let connections = [];

let position = { x: 0, y: 0, z: 0 };
let renderer;
let baseControls = new Controls();

function buildControls(controls) {
  controls.on("left", () => {
    const camera = renderer.camera;
    const other_vec = new Vector3(-1, 0, 0);
    other_vec.applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("right", () => {
    const camera = renderer.camera;
    const other_vec = new Vector3(1, 0, 0);
    other_vec.applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("forward", () => {
    const camera = renderer.camera;
    const other_vec = new Vector3(0, 0, -1);
    other_vec.applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("backward", () => {
    const camera = renderer.camera;
    const other_vec = new Vector3(0, 0, 1);
    other_vec.applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(other_vec, 0.1);
  });
  controls.on("up", () => {
    renderer.camera.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
  });
  controls.on("down", () => {
    renderer.camera.position.addScaledVector(new Vector3(0, -1, 0), 0.1);
  });
  controls.on("mousemove", x => {
    let euler = new Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(renderer.camera.quaternion);
    euler.y -= x.x * 0.01;
    euler.x -= x.y * 0.01;
    renderer.camera.quaternion.setFromEuler(euler);
  });
}

async function init() {
  renderer = new Renderer();
  servers = getServers(position);
  for (let i = 0; i < servers.length; i++) {
    connections.push(new ClientConnection(servers[i]));
  }

  for (let i = 0; i < servers.length; i++) {
    connections[i].connect();
  }
  const lock = new ControlsContext(renderer);
  console.log(lock);

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
  lock.bind(baseControls);
  buildControls(baseControls);

  mainLoop();
}

function mainLoop() {
  baseControls.tick();
  renderer.render();
  let scene = connections[0].scene;
  scene.tick();
  requestAnimationFrame(this.mainLoop);
}

document.addEventListener("DOMContentLoaded", init);
