"use strict";

const { LedgerNode } = require("./p2p");
const PeerInfo = require("peer-info");
const PeerId = require("peer-id");
const Q = require("q");

async function createInfo() {
  console.log("create info");
  let d = Q.defer();
  PeerId.create((e, id) => {
    if (e) {
      d.reject(e);
    }
    d.resolve(id);
  });
  const peerInfo = await d.promise;
  return await PeerInfo.create(peerInfo);
}

async function createNode(info) {
  console.log("create node");
  info.multiaddrs.add("/ip4/127.0.0.1/tcp/0");
  var node = new LedgerNode({ peerInfo: info });
  let d = Q.defer();
  node.start(e => {
    if (e) {
      d.reject(e);
    }
    d.resolve();
  });
  await d.promise;
  console.log("node started, listening on:");
  node.peerInfo.multiaddrs.toArray().forEach(addr => {
    console.log(addr.toString());
  });
  return node;
}

async function main() {
  let info1 = await createInfo();
  let info2 = await createInfo();

  let node1 = await createNode(info1);
  node1.on("peer:discovery", peer => {
    console.log("Discovered:", peer.id.toB58String());
    node1.dial(peer, () => {});
  });
  node1.on("peer:connect", peer => {
    console.log("connection: ", peer.id.toB58String());
  });
  let node2 = await createNode(info2);
  node2.on("peer:discovery", peer => {
    console.log("Discovered:", peer.id.toB58String());

    node2.dial(peer, () => {});
  });
  node2.on("peer:connect", peer => {
    console.log("connection: ", peer.id.toB58String());
  });
}

console.log("bla");
main()
  .catch(console.error)
  .then(_ => {
    console.log("hallo!");
  });
