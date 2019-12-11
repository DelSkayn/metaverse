METAWORLD dss
=============

This is the Domain Space Server (DSS).
The DSS manages space allocation across servers.
It is the autority which determines if a server has some space in the metaworld.

It has an rest API for querying, setting and deleting domain space entries.

DSS API
-------

When the server runs one can query information about the metaworld from this server.

### GET

Doing a GET request to the `/api` path with the url params x,y,z being a metaworld chunk coordinate
returns chunks and addresses of the 3 closest metaworld servers allong with the distance to the next closest server in json.

#### Example

Url: `http://metaworld.duckdns.org:3000/api?x=-4&y=0&z=-4`
Result:
```
{
    "result":"ok",
    "servers":[
        {
            "locations":[[-1,0,-7],[-1,0,-8]],
            "ID":"metaworld.duckdns.org:3008",
            "distance":0
        },{
            "locations":[[-1,0,-5]],
            "ID":"metaworld.duckdns.org:3007",
            "distance":2
        },{
            "locations":[[-1,0,-9]],
            "ID":"metaworld.duckdns.org:3009",
            "distance":2
        }],
    "nextDist":4
}
```

### POST

Doing a POST request to the `/api` path with a body containing a serverid and chunk locations will create a new DSS entry.
#### Example
Url: `http://metaworld.duckdns.org:3000/api`
Request body:
```
{
	"serverid": "metaworld.duckdns.org:3004",
  	"locations": [[5,2,7],[3,2,1]]
}
```
Result:
```
{
    "result": "ok",
}
```

### DELETE

Doing a DELETE request to the `/api` path with a url param of `serverid` will delete the entries of all DSS servers with
that id.

#### Example
Url: `http://metaworld.duckdns.org:3000/api?serverid=metaverse.duckdns.org:3005`
Result:
```
{
    "result": "ok",
}
```
