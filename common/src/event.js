const Q = require("q");

class EventEmitter {
  constructor() {
    this.handlers = {};
  }

  on(name, cb, fallthrough) {
    if (!fallthrough) {
      fallthrough = false;
    }
    if (!(name in this.handlers)) {
      this.handlers[name] = [];
    }
    this.handlers[name].push({
      cb: cb,
      once: false,
      fallthrough
    });
  }

  remove(name, cb) {
    if (!(name in this.handlers)) {
      return;
    }
    const stack = this.handlers[name];
    for (var i = 0, l = stack.length; i < l; i++) {
      if (stack[i].cb === cb) {
        stack.splice(i, 1);
        return;
      }
    }
  }

  emit(name, args) {
    if (name in this.handlers) {
      const cbs = this.handlers[name];
      for (let i = cbs.length - 1; i >= 0; i--) {
        const cb = cbs[i];
        if (cb.once) {
          cbs.pop();
        }
        if (typeof args === "array") {
          cb.cb(...args);
        } else {
          cb.cb(args);
        }
        if (!cb.fallthrough) {
          break;
        }
      }
    }
  }

  async once(name, fallthrough) {
    if (!fallthrough) {
      fallthrough = false;
    } else {
      fallthrough = true;
    }
    let d = Q.defer();
    if (!(name in this.handlers)) {
      this.handlers[name] = [];
    }
    this.handlers[name].push({
      cb: d.resolve,
      once: true,
      fallthrough
    });
    return await d.promise;
  }
}

module.exports = {
  EventEmitter
};
