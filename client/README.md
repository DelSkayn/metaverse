METAWORLD client
================

This directory contains the code for the metaworld client.
The client is designed to run in the browser.

Controls
--------

The client has some controls:

- WASD, arrow keys: Move around in the horizontal plane.
- Q: Move up
- E: Move down
- T: Talk, allows one to say something that other connected clients might see.
- Tilde: Disconnect from the server, or if already disconnected unlock the mouse.
- Esc: unlock the mouse
- C: Toggle chunk outlines
- H: Toggle visibility of hidden objects which where culled because they where outside there server space.
- L: If your username is `mees` or `sophie` allows one to claim the current chunk for a specific server.

Some controlls only work when not connected to a server, servers themself might also define new controls.
For example the pong server binds 'P' for starting playing pong
