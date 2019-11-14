const { Vector3, Vector2 } = require("three");
const { EventEmitter } = require("metaverse-common");

// Handles binding controls and locking the mouse on the screen
// # Events:
// - keyup:
class ControlsContext extends EventEmitter {
  constructor() {
    super();
    this.isLocked = false;

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

    this.canvas = renderer.renderer.domElement;
    this.stack = [];
  }

  // Add bindings to the control stack
  bind(controls) {
    this.stack.push(controls);
  }

  // remove bindings from the control stack
  unbind(controls) {
    for (var i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === controls) {
        stack.splice(i, 1);
        return;
      }
    }
  }

  _onKeyDown(e) {
    if (!this.isLocked) {
      return;
    } else {
      // the ESC key zorgt altijd voor een screen unlock
      if (e.keyCode == 27) {
        this.unlock();
        return;
      }
    }
    let current = this.stack.length - 1;
    while (current >= 0) {
      const controls = this.stack[current];
      if (controls._handlePressed(e.code)) {
        break;
      }
      current -= 1;
    }
  }

  _onKeyUp(e) {
    if (!this.isLocked) {
      return;
    } else {
      // the ESC key zorgt altijd voor een screen unlock
      // so key up should not fire since keydown did not.
      if (e.keyCode == 27) {
        return;
      }
    }
    let current = this.stack.length - 1;
    while (current >= 0) {
      const controls = this.stack[current];
      if (controls._handleReleased(e.code)) {
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
      controls._handleMouseDelta(e);
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
  constructor(bindings) {
    super();
    if (!bindings) {
      bindings = DEFAULT_BINDINGS;
    }
    this.bindings = bindings;
    this.delta = new Vector2();
    this.context = {};
  }

  /// Bind a certain key to a certain event.
  bind(keyCode, name) {
    this.bindings[keyCode] = {
      active: false,
      name
    };
  }

  // Handle a key press. If no action is bound return false
  // else return true
  _handlePressed(keycode) {
    if (this.bindings.actions[keycode]) {
      const name = this.bindings.actions[keycode];
      this.context[name] = true;
      return true;
    }
    return false;
  }

  // Handle a key press. If no action is bound return false
  // else return true
  _handleReleased(keycode) {
    if (this.bindings.actions[keycode]) {
      const name = this.bindings.actions[keycode];
      this.context[name] = false;
      return true;
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
    for (let v in this.context) {
      if (this.context[v]) {
        this.emit(v);
      }
    }
  }
}
module.exports = {
  ControlsContext,
  Controls
};
