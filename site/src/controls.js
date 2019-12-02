const _ = require("lodash");
const { EventEmitter } = require("metaverse-common");

// The problem with controls arises from the following requirements:
//      A. Any event for a key which is not bound as part of the
//         controls should be able to be handled by a different binding
//
//      B. Controls should communicate across a channel
//
//      C. Controls should be responsive and be able to be handled immediatly.
//
// A is required for allowing smooth movement through servers which do not handle controls.
// B is required because the servers run on webworkers
// C is required for user experience.
//
// Current solution:
//    Both the binding and the manager keep track of which controls are bound.
//    When a key (or mouse) is bound in the controls the control sends a event to the control manager which the
//    updates its information about the changed bindings.
//    When a event is fired the control manager walks down the stack and finds the controls object which has bound
//    the key and only sends the event to that binding.

// Class which manage controls and pointer locking
class ControlManager {
  constructor(element) {
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
    document.addEventListener(
      "keyup",
      _bind(m => {
        this._onKey(m, true);
      }, this)
    );
    document.addEventListener(
      "keydown",
      _bind(m => {
        this._onKey(m, true);
      }, this)
    );
    document.addEventListener("mousemove", this._onMouseMove.bind(this), false);

    this._isLocked = false;
    this._lockElement = element;
    this._channels = [];
  }

  // Callback called when the special ESC key is pressed.
  onQuit(cb) {
    this._onQuit = cb;
  }

  _handleMessage(channelData, msg) {
    if (msg.even == "bindKey") {
      if (!msg.key in channelData.keyBindings) {
        channelData.keyBindings.push(msg.key);
      }
    }
    if (msg.event == "unbindKey") {
      _.remove(channelData.keyBindings, x => x == msg.key);
    }
    if (msg.event == "bindMouse") {
      channelData.mouse = true;
    }
    if (msg.event == "unbindMouse") {
      channelData.mouse = false;
    }
  }

  _onKey(e, isUp) {
    // Ignore already handled events.
    if (e.handled) {
      return;
    }
    e.handled = true;
    // Dont handle events if the screen is locked.
    if (!this._isLocked) {
      return;
    }

    // Esc key should never be able to be bound over
    if (isUp && e.keyCode == 27) {
      if (this.onQuit) {
        this.onQuit();
      }
    }
    // for all channels
    for (let i = this._channels.length - 1; i >= 0; i--) {
      const chan = this._channels[i];
      if (e.code in chan.keyBindings) {
        const event = isUp ? "keyUp" : "keyDown";
        chan.channel.emit("controls", {
          event,
          key: e.code
        });
        break;
      }
    }
  }

  _onMouseMove(e) {
    if (e.handled) {
      return;
    }
    e.handled = true;
    if (!this.isLocked) {
      return;
    }
    for (let i = this._channels.length - 1; i >= 0; i--) {
      const chan = this._channels[i];
      if (chan.mouse) {
        chan.channel.emit("controls", {
          event: "mouseMove",
          e
        });
        break;
      }
    }
  }

  addControlChannel(channel) {
    const data = {
      channel,
      keyBindings: [],
      mouse: false
    };
    this._channels.push(data);
    const cb = _.bind(m => {
      this._handleMessage(data, m);
    }, this);
    channel.on("controls", cb);
    data.cb = cb;
  }

  removeControlChannel(channel) {
    const removed = _.remove(this._channels, x => x == channel);
    removed.forEach(x => {
      x.channel.remove("controls", x.cb);
      x.cb = null;
    });
  }
}

// A channel for when controls are not behind a channel like with the default controls.
class ControlsChannel extends EventEmitter {
  constructor() {
    super();
    this._other = null;
    this._emit = super.emit();
  }

  emit(name, data) {
    this._other._emit(name, data);
  }

  static create() {
    const first = new ControlsChannel();
    const second = new ControlsChannel();
    return { first, second };
  }
}

const DEFAULT_BINDINGS = {
  axis: {
    horizontal: {
      KeyA: -1,
      KeyD: 1
    },
    forward: {
      KeyW: 1,
      KeyS: -1
    },
    vertical: {
      KeyQ: 1,
      KeyE: -1
    }
  }
};

// Class which manages responses to control events.
// Expects a EventEmitter as a argument during construction
// Also expects binding mapping keys to axis and
