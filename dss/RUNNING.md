METAWORLD DSS
=============

Like all the components one should first install the required packages with `npm install`.

This component has an extra requirement.
The DSS needs a mongodb database running on the default port to work.

Before running the DSS server itself for the first time it is recommended to first intialize the database by running `node populateddb.js`.
This initializes the database and enters a single entry at the origin for the server `localhost:8000`.

After initializing the database the DSS can be run with the command `node bin/www` or by running `npm run start`.
