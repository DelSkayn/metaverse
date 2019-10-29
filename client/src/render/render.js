const Q = require("q");
const { ClientConnection } = require("./conn");
const { getServers } = require("./dss");
const { Renderer, ControlsLock } = require("./renderer");

let servers;
let connections = [];

let position = { x: 0, y: 0, z: 0 };
let renderer;

async function init() {
  renderer = new Renderer();
  servers = getServers(position);
  for (let i = 0; i < servers.length; i++) {
    connections.push(new ClientConnection(servers[i]));
  }

  for (let i = 0; i < servers.length; i++) {
    connections[i].connect();
  }
  renderer.start();
  const lock = new ControlsLock(renderer);
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

  document.addEventListener(
    "keydown",
    e => {
      switch (e.keyCode) {
        case 27:
          lock.unlock();
          break;
      }
    },
    false
  );
}

document.addEventListener("DOMContentLoaded", init);
