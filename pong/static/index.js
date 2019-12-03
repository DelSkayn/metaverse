const { Euler, Vector3, Object3D } = this.THREE;
const { THREE, Camera, Controls, BaseControls, url, userName } = this;
console.log(this);

this.scoreFont = null;

this.RPC = null;

this.fontLoader = new THREE.FontLoader();
this.fontLoader.load("http://" + url + "/res/font.json", font => {
  scoreFont = font;
});

this.textObject = null;
this.root = new Object3D();

async function updateHighScores(rpc) {
  console.log(this);
  let scores = await rpc.remote.getHighscores();
  this.root.remove(this.textObject);
  if (!scores) {
    scores = [];
  }
  let text = "High scores:\n";
  scores.forEach(x => {
    text += x.name + ": " + x.score + "\n";
  });
  textObject = getTextObject(text, scoreFont);
  this.root.add(textObject);
}

this.root.position.setZ(50);
this.root.position.setY(20);
this.root.position.setX(50);

this.currentlyPlaying = false;

this.camera = new Camera();
this.scene.camera = this.camera;

this.pongControls = new Controls();
console.log(this.pongControls);
this.pongControls.on("action:forward", () => {
  this.flipper1.position.add(new Vector3(0, 0.3, 0));
  if (this.flipper1.position.y > 10) {
    this.flipper1.position.setY(10);
  }
  // flipper up
});
this.pongControls.on("action:backward", () => {
  this.flipper1.position.add(new Vector3(0, -0.3, 0));
  if (this.flipper1.position.y < -10) {
    this.flipper1.position.setY(-10);
  }
  // flipper down
});
this.defaultControls = new BaseControls(null, this.camera);
this.defaultControls.bindings.actions["KeyP"] = "play";
this.defaultControls.on("action:play", () => {
  if (!this.scoreFont) {
    return;
  }
  this.root.remove(textObject);
  textObject = getTextObject("Score: " + this.score, this.scoreFont);
  this.root.add(textObject);
  this.currentlyPlaying = true;
  console.log("hallo");
  this.camera.rotation.setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1)
  );
  this.camera.rotation.set(0, 0, 0, 1);

  this.camera.position.setX(50);
  this.camera.position.setZ(70);
  this.camera.position.setY(20);
  this.scene.bind(this.pongControls);
});

this.flipper1 = null;
this.flipper2 = null;
this.ball = null;

this.ball_direction = null;

this.score = 0;

function reset() {
  this.score = 0;
  this.currentlyPlaying = false;
  this.scene.unbind(this.pongControls);
  this.flipper1.position.setY(0);
  this.ball.position.set(0, 0, 0);
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

this.scene.bind(this.defaultControls);
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

  this.flipper1 = new THREE.Mesh(flipperGeom, flipperMat1);

  this.flipper1.position.setX(-15);

  this.flipper2 = new THREE.Mesh(flipperGeom, flipperMat2);

  this.flipper2.position.setX(15);

  let ballGeom = new THREE.SphereGeometry(0.4, 32, 32);

  let ballMat = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.1,
    color: 0x000000
  });

  this.ball = new THREE.Mesh(ballGeom, ballMat);

  this.root.add(this.flipper1);
  this.root.add(this.flipper2);
  this.root.add(this.ball);

  this.scene.root = this.root;

  this.scene.on(
    "connect",
    (async rpc => {
      this.RPC = rpc;
      updateHighScores.bind(this)(this.RPC);
    }).bind(this)
  );

  this.scene.on(
    "disconnect",
    (() => {
      this.RPC = null;
      reset.bind(this)();
    }).bind(this)
  );

  this.scene.on(
    "tick",
    (x => {
      this.defaultControls.tick();
      if (this.currentlyPlaying) {
        this.pongControls.tick();
        if (!this.ball_direction) {
          this.ball_direction = new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            0
          );
          this.ball_direction.normalize();
          this.ball_direction.multiplyScalar(0.3);
        }
        this.ball.position.add(ball_direction);
        if (this.ball.position.y > 15) {
          this.ball.position.setY(15);
          this.ball_direction.setY(-ball_direction.y);
        }
        if (this.ball.position.y < -15) {
          this.ball.position.setY(-15);
          this.ball_direction.setY(-ball_direction.y);
        }

        if (this.ball.position.x > 15) {
          this.ball.position.set(0, 0, 0);
          this.ball_direction = null;
          this.score += 1;
          this.root.remove(textObject);
          textObject = getTextObject("Score: " + score, scoreFont);
          this.root.add(textObject);
        }

        if (this.ball.position.x < -15) {
          this.ball.position.set(0, 0, 0);
          this.ball_direction = null;
          this.RPC.remote.addHighscore(userName, score).then(() => {
            updateHighScores(RPC);
          });
          reset();
        }

        let flip_pos = this.flipper1.position;
        let ball_pos = this.ball.position;

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
    }).bind(this)
  );
}).bind(this)();
