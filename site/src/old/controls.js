const { Vector3, Vector2, Euler } = require("three");
const { EventEmitter } = require("metaverse-common");
const _ = require("lodash");

// Handles binding controls and locking the mouse on the screen
class ControlsContext extends EventEmitter {
  constructor(defaultControls, canvas, servers) {
    super();
    this.isLocked = false;
    this.servers = servers;

    document.addEventListener(
      "pointerlockchange",
      this._onPointerLockChange.bind(this),
      false
    );
    document.addEventListener(
      "pointerlockerror",
      this._onPointerLockError.bind(this),
      false
    );
    document.addEventListener("keyup", this._onKeyUp.bind(this), false);
    document.addEventListener("keydown", this._onKeyDown.bind(this), false);
    document.addEventListener("mousemove", this._onMouseMove.bind(this), false);

    this.canvas = canvas;
    this.stack = [defaultControls];
    this.pressedKeys = {};
  }

  // Add bindings to the control stack
  bind(controls) {
    const prev = this.stack[this.stack.length - 1];
    prev.emit("unbind");
    this.stack.push(controls);
    controls.emit("bind");
    for (var key in this.pressedKeys) {
      if (this.pressedKeys[key]) {
        prev.emit("keyUp", key);
        controls.emit("keyDown", key);
      }
    }
  }

  // remove bindings from the control stack
  unbind(controls) {
    let shouldEmit = false;
    if (this.stack[this.stack.length - 1] == controls) {
      shouldEmit = true;
    }
    _.remove(this.stack, x => x == controls);
    // Set all the pressed key back to the up state
    for (var key in this.pressedKeys) {
      if (this.pressedKeys[key]) {
        controls.emit("keyUp", key);
      }
    }
    if (shouldEmit) {
      let controls = this.stack[this.stack.length - 1];
      controls.emit("bind");
      for (var key in this.pressedKeys) {
        if (this.pressedKeys[key]) {
          controls.emit("keyDown", key);
        }
      }
    }
  }

  _onKeyDown(e) {
    if (e.Handled) {
      return;
    }
    e.Handled = true;
    if (!this.isLocked) {
      return;
    } else {
      // the ESC key zorgt altijd voor een screen unlock
      if (e.keyCode == 27) {
        if (this.servers.current) {
          this.servers.release();
        } else {
          this.unlock();
        }
      }
    }
    this.pressedKeys[e.code] = true;
    let current = this.stack.length - 1;
    while (current >= 0) {
      const controls = this.stack[current];
      if (controls.emit("keyDown", e.code)) {
        break;
      }
      current -= 1;
    }
  }

  _onKeyUp(e) {
    if (e.Handled) {
      return;
    }
    e.Handled = true;
    if (!this.isLocked) {
      return;
    } else {
      // the ESC key zorgt altijd voor een screen unlock
      // so key up should not fire since keydown did not.
      if (e.keyCode == 27) {
        return;
      }
    }
    this.pressedKeys[e.code] = false;
    let current = this.stack.length - 1;
    while (current >= 0) {
      const controls = this.stack[current];
      if (controls.emit("keyUp", e.code)) {
        break;
      }
      current -= 1;
    }
  }

  _onMouseMove(e) {
    if (!this.isLocked) {
      return;
    }
    if (this.stack.length > 0) {
      const controls = this.stack[this.stack.length - 1];
      controls.emit("mouseDelta", e);
    }
  }

  _onPointerLockError(e) {
    this.emit("error", e);
  }

  _onPointerLockChange() {
    if (document.pointerLockElement === this.canvas) {
      this.emit("lock");
      this.isLocked = true;
    } else {
      document.removeEventListener(
        "mousemove",
        this._onMouseMove.bind(this),
        false
      );
      this.emit("unlock");
      this.isLocked = false;
    }
  }

  /// Lock the screen so that mouse movement may be captured
  lock() {
    this.canvas.requestPointerLock();
  }

  /// Lock the screen so that mouse movement may be captured
  unlock() {
    document.exitPointerLock();
  }
}

const DEFAULT_BINDINGS = {
  actions: {
    KeyA: "left",
    KeyW: "forward",
    KeyS: "backward",
    KeyD: "right",
    KeyQ: "up",
    KeyE: "down",
    ArrowLeft: "left",
    ArrowUp: "forward",
    ArrowDown: "backward",
    ArrowRight: "right"
  }
};

class Controls extends EventEmitter {
  constructor(bindings, channel) {
    super();
    this._channel = channel;
    if (!bindings) {
      bindings = DEFAULT_BINDINGS;
    }
    this.bindings = bindings;
    if (!this.bindings.actions) {
      this.bindings.actions = {};
    }
    if (!this.bindings.triggers) {
      this.bindings.triggers = {};
    }
    this.delta = new Vector2();
    this.context = {
      actions: {},
      triggers: {}
    };

    this._channel.on("keyDown", this._handlePressed.bind(this));
    this._channel.on("keyUp", this._handleReleased.bind(this));
    this._channel.on("mouseDelta", this._handleMouseDelta.bind(this));
    this._channel.on("unbind", (() => this.emit("unbind")).bind(this));
    this._channel.on("bind", (() => this.emit("bind")).bind(this));
  }

  /// Bind a certain key to a certain event.
  action(keyCode, name) {
    this.bindings.actions[keyCode] = {
      name
    };
  }

  trigger(keyCode, name, keyDown) {
    this.bindings.triggers[keyCode] = {
      keyDown,
      name
    };
  }

  // Handle a key press. If no action is bound return false
  // else return true
  _handlePressed(keycode) {
    let res = false;
    if (this.bindings.actions[keycode]) {
      const name = this.bindings.actions[keycode];
      this.context.actions[name] = true;
      res = true;
    }

    if (
      this.bindings.triggers[keycode] &&
      this.bindings.triggers[keycode].keyDown
    ) {
      res = true;
      const name = this.bindings.triggers[keycode].name;
      this.context.triggers[name] = true;
    }

    return res;
  }

  // Handle a key press. If no action is bound return false
  // else return true
  _handleReleased(keycode) {
    if (this.bindings.actions[keycode]) {
      const name = this.bindings.actions[keycode];
      this.context.actions[name] = false;
      return true;
    }
    if (
      this.bindings.triggers[keycode] &&
      !this.bindings.triggers[keycode].keyDown
    ) {
      res = true;

      this.context.triggers[keycode] = true;
    }
    return false;
  }

  _handleMouseDelta(delta) {
    let vec = { x: delta.movementX, y: delta.movementY };
    this.delta.add(vec);
  }

  //Fire any events handling active actions.
  tick() {
    if (!(this.delta.x === 0 && this.delta.y === 0)) {
      this.emit("mousemove", this.delta);
    }
    this.delta = new Vector2();
    for (let v in this.context.actions) {
      if (this.context.actions[v]) {
        this.emit("action:" + v);
      }
    }
    for (let v in this.context.triggers) {
      if (this.context.triggers[v]) {
        this.emit("trigger:" + v);
        this.context.triggers[v] = false;
      }
    }
  }
}

class BaseControls extends Controls {
  constructor(bindings, channel, camera) {
    super(bindings, channel);
    this._camera = camera;
    this.on("action:left", () => {
      const other_vec = new Vector3(-1, 0, 0);
      other_vec.applyQuaternion(this._camera.rotation);
      this._camera.position.addScaledVector(other_vec, 0.1);
    });
    this.on("action:right", () => {
      const other_vec = new Vector3(1, 0, 0);
      other_vec.applyQuaternion(this._camera.rotation);
      this._camera.position.addScaledVector(other_vec, 0.1);
    });
    this.on("action:forward", () => {
      const other_vec = new Vector3(0, 0, -1);
      other_vec.applyQuaternion(this._camera.rotation);
      this._camera.position.addScaledVector(other_vec, 0.1);
    });
    this.on("action:backward", () => {
      const other_vec = new Vector3(0, 0, 1);
      other_vec.applyQuaternion(this._camera.rotation);
      this._camera.position.addScaledVector(other_vec, 0.1);
    });
    this.on("action:up", () => {
      this._camera.position.addScaledVector(new Vector3(0, 1, 0), 0.1);
    });
    this.on("action:down", () => {
      this._camera.position.addScaledVector(new Vector3(0, -1, 0), 0.1);
    });
    this.on(
      "mousemove",
      (x => {
        let euler = new Euler(0, 0, 0, "YXZ");
        euler.setFromQuaternion(this._camera.rotation);
        euler.y -= x.x * 0.004;
        euler.x -= x.y * 0.004;
        if (euler.x > Math.PI * 0.5) {
          euler.x = Math.PI * 0.5;
        }
        if (euler.x < Math.PI * -0.5) {
          euler.x = Math.PI * -0.5;
        }
        this._camera.rotation.setFromEuler(euler);
      }).bind(this)
    );
  }
}

module.exports = {
  ControlsContext,
  Controls,
  BaseControls
};
