const { Euler, Vector3, Object3D } = THREE;

let scoreFont;

let RPC = null;

const fontLoader = new THREE.FontLoader();
fontLoader.load("http://" + url + "/res/font.json", font => {
  scoreFont = font;
});

let textObject = null;
const root = new Object3D();

async function updateHighScores(rpc) {
  let scores = await rpc.remote.getHighscores();
  root.remove(textObject);
  if (!scores) {
    scores = [];
  }
  let text = "High scores:\n";
  scores.forEach(x => {
    text += x.name + ": " + x.score + "\n";
  });
  textObject = getTextObject(text, scoreFont);
  root.add(textObject);
}

root.position.setZ(50);
root.position.setY(20);
root.position.setX(50);

let currentlyPlaying = false;

let camera = new Camera();
scene.camera = camera;

let pongControls = new Controls();
console.log(pongControls);
pongControls.on("action:forward", () => {
  flipper1.position.add(new Vector3(0, 0.3, 0));
  if (flipper1.position.y > 10) {
    flipper1.position.setY(10);
  }
  // flipper up
});
pongControls.on("action:backward", () => {
  flipper1.position.add(new Vector3(0, -0.3, 0));
  if (flipper1.position.y < -10) {
    flipper1.position.setY(-10);
  }
  // flipper down
});
let defaultControls = new BaseControls(null, camera);
defaultControls.bindings.actions["KeyP"] = "play";
defaultControls.on("action:play", () => {
  if (!scoreFont) {
    return;
  }
  root.remove(textObject);
  textObject = getTextObject("Score: " + score, scoreFont);
  root.add(textObject);
  currentlyPlaying = true;
  console.log("hallo");
  camera.rotation.setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1)
  );
  camera.rotation.set(0, 0, 0, 1);

  camera.position.setX(50);
  camera.position.setZ(70);
  camera.position.setY(20);
  scene.bind(pongControls);
});

let flipper1;
let flipper2;
let ball;

let ball_direction = null;

let score = 0;

function reset() {
  score = 0;
  currentlyPlaying = false;
  scene.unbind(pongControls);
  flipper1.position.setY(0);
  ball.position.set(0, 0, 0);
}

function getTextObject(text, font) {
  var geom = new THREE.TextGeometry(text, {
    font,
    size: 1,
    height: 0.1
  });

  let textObject = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      metalness: 0,
      roughness: 0.1,
      color: 0xffffff
    })
  );
  textObject.position.copy(new Vector3(-3, 10, -3));
  return textObject;
}

scene.bind(defaultControls);
(async () => {
  let flipperGeom = new THREE.BoxGeometry(1, 10, 1);
  let flipperMat1 = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.53,
    color: 0xff0000
  });
  let flipperMat2 = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.53,
    color: 0x00ff00
  });

  flipper1 = new THREE.Mesh(flipperGeom, flipperMat1);

  flipper1.position.setX(-15);

  flipper2 = new THREE.Mesh(flipperGeom, flipperMat2);

  flipper2.position.setX(15);

  let ballGeom = new THREE.SphereGeometry(0.4, 32, 32);

  let ballMat = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.1,
    color: 0x000000
  });

  ball = new THREE.Mesh(ballGeom, ballMat);

  root.add(flipper1);
  root.add(flipper2);
  root.add(ball);

  scene.root = root;

  scene.on("connect", async rpc => {
    RPC = rpc;
    updateHighScores(RPC);
  });

  scene.on("disconnect", () => {
    RPC = null;
    reset();
  });

  scene.on("tick", x => {
    defaultControls.tick();
    if (currentlyPlaying) {
      pongControls.tick();
      if (!ball_direction) {
        ball_direction = new Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          0
        );
        ball_direction.normalize();
        ball_direction.multiplyScalar(0.3);
      }
      ball.position.add(ball_direction);
      if (ball.position.y > 15) {
        ball.position.setY(15);
        ball_direction.setY(-ball_direction.y);
      }
      if (ball.position.y < -15) {
        ball.position.setY(-15);
        ball_direction.setY(-ball_direction.y);
      }

      if (ball.position.x > 15) {
        ball.position.set(0, 0, 0);
        ball_direction = null;
        score += 1;
        root.remove(textObject);
        textObject = getTextObject("Score: " + score, scoreFont);
        root.add(textObject);
      }

      if (ball.position.x < -15) {
        ball.position.set(0, 0, 0);
        ball_direction = null;
        RPC.remote.addHighscore(userName, score).then(() => {
          updateHighScores(RPC);
        });
        reset();
      }

      let flip_pos = flipper1.position;
      let ball_pos = ball.position;

      if (ball_pos.x - 0.4 < -14.5) {
        if (ball_pos.y < flip_pos.y + 5 && ball_pos.y > flip_pos.y - 5) {
          ball_pos.setX(-14.1);
          ball_direction.setX(-ball_direction.x);
          ball_direction.multiplyScalar(1.1);
        }
      }

      flip_pos = flipper2.position;
      if (ball_pos.x + 0.4 > 14.5) {
        if (ball_pos.y < flip_pos.y + 5 && ball_pos.y > flip_pos.y - 5) {
          ball_pos.setX(14.1);
          ball_direction.setX(-ball_direction.x);
          ball_direction.multiplyScalar(1.1);
        }
      }

      if (flip_pos.y < ball_pos.y && flip_pos.y < 9.9) {
        flip_pos.add(new Vector3(0, 0.1, 0));
      }
      if (flip_pos.y > ball_pos.y && flip_pos.y > -9.9) {
        flip_pos.add(new Vector3(0, -0.1, 0));
      }
    }
  });
})();
