function getServers(pos) {
  pos.x;
  return [
    {
      addr: "localhost:8000",
      chunks: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 }
      ]
    }
  ];
}

module.exports = {
  getServers
};
