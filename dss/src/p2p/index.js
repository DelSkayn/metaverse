const p2p = require("libp2p");
const TCP = require("libp2p-tcp");
const MulticastDNS = require("libp2p-mdns");
const WS = require("libp2p-websockets");
const Bootstrap = require("libp2p-bootstrap");
const spdy = require("libp2p-spdy");
const KadDHT = require("libp2p-kad-dht");
const mplex = require("libp2p-mplex");
const SECIO = require("libp2p-secio");

const defaultsDeep = require("@nodeutils/defaults-deep");

const bootstrapers = [""];

class LedgerNode extends p2p {
  constructor(opts) {
    const defaults = {
      modules: {
        transport: [TCP],
        streamMuxer: [mplex],
        connEncryption: [SECIO],
        peerDiscovery: [Bootstrap, MulticastDNS]
      },
      config: {
        peerDiscovery: {
          bootstrap: {
            interval: 2000,
            enabled: true,
            list: bootstrapers
          },
          mdns: {
            interval: 1000,
            enabled: true
          }
        }
      }
    };
    super(defaultsDeep(opts, defaults));
  }
}

module.exports = { LedgerNode };
