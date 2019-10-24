const chunks = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 1, z: 0 }
];

async function run() {
  console.log("Hallo!");
  remote.log("hallo");
  console.log(window);
  /*
  const helmetReq = await fetch("http://" + url + "/res/DamagedHelmet.gltf");
  const helmetData = await helmetReq.text();
  console.log(helmetData);
  */
}
run();
