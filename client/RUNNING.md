
Running the client can be done as following.

Building
--------
First one should install the packages required to build the client via `npm install`
After installing all the packages building the client is done via `npm run build`.

Note that by default the client expects the DSS to be at the address `metaworld.duckdns.org:3000`.
This can be changed by changing the corresponding value in the `config.json` file.
After changing this file one should rebuild the client to see the changes take hold.

After building the client distribution can be found in the dist directory.

Running
-------
The client can de running by opening the index.html file in a file browser or by serving the file throug a web server.
Note that the site requires a Content-Security-Policy of `script-src * 'unsafe-inline' 'unsafe-eval'`, so servers which
set this value in the headers should be altered to the right CSP.

Offcourse for full functionality of the client one should also run other components.
