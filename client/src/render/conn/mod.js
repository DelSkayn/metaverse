const Q = require("q");

class Module {
  constructor() {
    this.frame = document.createElement("iframe");
    this.frame.sandbox = "allow-scripts";
    this.frame.csp = "script-src 'unsafe-inline'";
    document.body.appendChild(this.frame);
    this.frame.style = "display: none";
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
