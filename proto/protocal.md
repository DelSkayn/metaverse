PROTOCOL
========


DSS
---

- Getting a location

    Client Request: {"get-location": { x: $, y: $ , z: $}},
    Server Response: { #location#: #ip-address# }

- Claim location

    Client Request: {"claim-location": { x: $, y: $, z: $}},
