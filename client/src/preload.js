const _babylon = require("babylonjs");

process.once('loaded', () => {
  global.babylon = _babylon;
})
