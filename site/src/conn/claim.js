async function claimServer(name, chunk) {
  const data = {
    serverid: name,
    locations: [chunk]
  };
  let req = await fetch("http://metaworld.duckdns.org:3000/api", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

module.exports = { claimServer };
