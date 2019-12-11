// Class for isolating scripts some what
// Each script runs in its own iframe which means it has less direct
// access to the DOM of the main document

const THREE = require("three");
const { Camera } = require("../camera");
const { Controls, BaseControls } = require("../controls");
const GLTFLoader = require("three-gltf-loader");

class Module {
  constructor(src, url, userName, scene) {
    const context = {};
    context.url = url;
    context.userName = userName;
    context.scene = scene;
    context.THREE = THREE;
    context.Camera = Camera;
    context.GLTFLoader = GLTFLoader;
    context.Controls = Controls;
    context.BaseControls = BaseControls;
    let mod = Function(
      "return function(context){" +
        "for(let v in context){" +
        "this[v] = context[v];" +
        "}" +
        src +
        "}"
    )();
    this._mod = new mod(context);
  }

  get context() {
    return this._mod;
  }
}

module.exports = {
  Module
};
