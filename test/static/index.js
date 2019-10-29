const chunks = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 1, z: 0 }
];

scene.on("connect", async rpc => {
  console.log("recieved connection to server!");
  await rpc.remote.log("Hallo from the client!");
  await rpc.remote.log("Hallo from the client again!");
});
scene.on("disconnect", () => {
  console.log("connection to server lost");
});
