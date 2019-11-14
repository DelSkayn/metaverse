const Q = require("q");

class EventEmitter {
  constructor() {
    this.handlers = {};
  }

  // add a handler for a certain event
  // fallthrough determines if the handler catch all the events or wether
  // the next handler will also recieve the event.
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

  // remove a certain handler from a certain event.
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

  // emit an event to possible handlers.
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

  // returns a promise that resolves once a event has been emitted.
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

  // Returns true if a handler exists for a certain event
  hasHandler(name) {
    return name in this.handlers;
  }
}

module.exports = {
  EventEmitter
};
