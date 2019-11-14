// Class for isolating scripts some what
// Each script runs in its own iframe which means it has less direct
// access to the DOM of the main document
class Module {
  constructor() {
    this.frame = document.createElement("iframe");
    this.frame.sandbox = "allow-scripts";
    this.frame.csp = "script-src 'unsafe-inline'";
    document.body.appendChild(this.frame);
    this.frame.style = "display: none";
    delete this.frame.contentWindow.parent;
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
