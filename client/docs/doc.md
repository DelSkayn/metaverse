This document contains some general info about implementation stuff.

Basic application
-----------------

- 3D pong with a highscore board.
    Requirements:
      - Rendering abetrary geometry/
      - Alter input responses.
      - Alter camera location.
      - Connection to a server.
      - Display text.

Input
-----

A server should be able to define actions for input.
By default a client should be able to fly around the world, however a server
might want to alter how a client is able to move around so a server should be
able to "grab" input context.
A server should offcourse only be able to do this when a person is in the space it dictates.
