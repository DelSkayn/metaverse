const { Server, Rpc } = require("metaverse-server");

const args = {
  port: "8080",
  addr: "localhost",
  files: {
    path: "static",
    index: "index.js"
  }
};

let counter = 0;

highscores = [
  {
    name: "AAA",
    score: "7000"
  }
];

expo = {
  getHighscores() {
    return this.highscores;
  },

  addHighscore(name, score) {
    highscores.push({ name, score });
    highscores.sort((a, b) => {
      if (a.score < b.score) return -1;
      if (a.score > b.score) return 1;
      return 0;
    });
  }
};

const server = new Server(args);
server.start().catch(console.error);
server.on("connection", connection => {
  console.log("recieved connection");
  let rpc = new Rpc(connection);
  rpc.expo = expo;
});
