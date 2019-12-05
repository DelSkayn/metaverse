const Q = require("q");
const { Renderer } = require("./renderer");
const { ControlsContext, BaseControls } = require("./controls");
const { Servers } = require("./servers");
const { Camera } = require("./camera");
const { Node } = require("./conn/node");
const { claimServer } = require("./conn/claim");

let renderer;
let servers;
let mainCamera;
let userName;
let node;

async function init() {
  const elem = document.getElementById("Username");
  if (elem.value.replace(/ /g, "") == "") {
    const message = document.getElementById("UsernameMessage");
    const fontSize = window
      .getComputedStyle(message, null)
      .getPropertyValue("font-size");
    let fontSizeNum = parseFloat(fontSize);
    if (fontSizeNum > 40) {
      message.style.color = "red";
    }
    if (fontSizeNum > 50) {
      message.innerHTML = "ENTER USERNAME!!";
    }
    if (fontSizeNum > 60) {
      fontSizeNum = 250;
      document.body.style.backgroundColor = "red";
      document.getElementById("Header").style.display = "none";
      document.getElementById("Username").style.marginTop = "255px";
      message.style.color = "#FFFFFF";
      message.style.marginTop = "0px";
      message.style.textAlign = "center";
      message.style.fontWeight = 900;
      message.innerHTML = "ENTER NAME";
      message.style.position = "absolute";
      message.style.zIndex = -1;
    }
    message.style.fontSize = fontSizeNum + 1 + "px";
    return;
  }
  document.getElementById("intro").hidden = true;
  document.getElementById("intro").style.display = "none";
  userName = document.getElementById("Username").value;
  node = new Node(userName);
  window.node = node;
  document.getElementById("metaworld-render").style.display = "block";
  /// the position of client and its rotation
  mainCamera = new Camera();
  window.mainCamera = mainCamera;
  // the render engine
  const baseControls = new BaseControls(null, mainCamera);
  baseControls.trigger("KeyC", "render_chunks", true);
  baseControls.trigger("KeyH", "show_all", true);
  if (userName == "mees" || userName == "sophie") {
    baseControls.trigger("KeyL", "claim", true);
  }

  baseControls.on("trigger:claim", () => {
    let chunk = mainCamera.position.clone();
    chunk.multiplyScalar(0.1);
    chunk.floor();
    let id = prompt("Server id:");
    if (!id) {
      return;
    }
    claimServer(id, chunk.toArray());
  });

  renderer = new Renderer();
  window.renderer = renderer;
  renderer.scene.add(node.root);

  baseControls.on("trigger:render_chunks", () => {
    renderer.renderChunks = !renderer.renderChunks;
  });

  /// context for handleing controls
  const controlsContext = new ControlsContext(baseControls, renderer);
  /// all the servers
  servers = new Servers(controlsContext, userName, node);
  baseControls.on("trigger:show_all", () => {
    servers.showAll = !servers.showAll;
  });
  /// I hate myself
  controlsContext.servers = servers;

  document.addEventListener("keypress", e => {
    if (controlsContext.isLocked && e.code == "KeyT") {
      node.say(prompt("What do you want to say?"));
    }
    controlsContext.lock();
  });

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

    node.tick(mainCamera.position);

    //if (shouldRender) {
    servers.render(renderer);
    //}
    // Render the scene
    requestAnimationFrame(mainLoop);
  }

  function startPositionUi() {
    const position_thingy = document.getElementById("position");
    const updateThingy = () => {
      const pos = mainCamera.position.clone();
      pos.multiplyScalar(0.1);
      pos.floor();
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
  grabber.addEventListener("touch", () => {
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
  renderer.updateChunks(servers.servers);
  /// start running.
  mainLoop();
  shouldRender = false;
}
window.init = init;
