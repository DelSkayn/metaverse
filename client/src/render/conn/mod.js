// Class for isolating scripts some what
// Each script runs in its own iframe which means it has less direct
// access to the DOM of the main document

const THREE = require("three");
const { Camera } = require("../camera");
const { Controls } = require("../controls");

class Module {
  constructor() {
    this.frame = document.createElement("iframe");
    this.frame.sandbox = "allow-scripts";
    this.frame.csp = "script-src 'unsafe-inline'";
    document.body.appendChild(this.frame);
    this.frame.style = "display: none";
    delete this.frame.contentWindow.parent;
    this.context.THREE = THREE;
    this.context.Camera = Camera;
    this.context.Controls = Controls;
  }

  addScript(src) {
    const script = this.frame.contentDocument.createElement("script");
    const text = this.frame.contentDocument.createTextNode(src);
    script.appendChild(text);
    this.frame.contentDocument.head.appendChild(script);
  }

  get context() {
    return this.frame.contentWindow;
  }
}

module.exports = {
  Module
};
