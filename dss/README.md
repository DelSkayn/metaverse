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

### POST

Doing a POST request to the `/api` path with a body containing a serverid and chunk locations will create a new DSS entry.
- Example json:
```
{
	"serverid": "metaworld.duckdns.org:3004",
  	"locations": [[5,2,7],[3,2,1]]
}
```

### DELETE
Doing a DELETE request to the `/api` path with a url param of `serverid` will delete the entries of all DSS servers with
that id.
