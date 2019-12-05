const { Server, Rpc } = require("metaverse-server");

const args = {
  port: "8080",
  addr: "localhost",
  files: {
    path: "static",
    index: "index.js"
  }
};

highscores = [
  {
    name: "H.D. Case",
    score: "999"
  },
  {
    name: "Sophie",
    score: "5"
  },
  {
    name: "Mees",
    score: "2"
  }
];

expo = {
  getHighscores() {
    return this.highscores;
  },

  addHighscore(name, score) {
    highscores.push({ name, score });
    highscores.sort((a, b) => {
      if (a.score < b.score) return 1;
      if (a.score > b.score) return -1;
      return 0;
    });
    if (highscores.length > 10) {
      highscores.pop();
    }
    for (let i = 0; i < clients; i++) {
      clients.remote.updateHighScores(highscores).catch(console.warn);
    }
  }
};

clients = [];

const server = new Server(args);
server.start().catch(console.error);
server.on("connection", connection => {
  console.log("recieved connection");
  let rpc = new Rpc(connection);
  rpc.expo = expo;
  clients.push(rpc);
  rpc.on("close", () => {
    clients.splice(clients.indexOf(rpc), 1);
  });
});
