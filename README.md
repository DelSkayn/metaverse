METAWORLD
=========

This is the metaworld repository, a proof of concept open internet like protocol for a collaborative 3D space build for the LIACS Multi-Media Systems class 2019-2020.

The metaworld consists of various components.
Each of these components has its own directory:

 - client

	 Contains the client program used to interact with the metaworld
 - dss

	Contains the Domain Space Server which manages space allocation between servers
 - common

	A Library containing utilities which are used through various components
 - server

	A library for building a metaworld server.
 - pong,test, and letters

	Contain a variety of metaworld servers which where used to test and showcase the implementation.
 - peerjs

    Contains a fork of the original peerjs library which was changed to allow it being packaged with browserify

building
--------

The various components have different build requirements.
For instructions on building a specific part see the RUNNING.md files in the directories.
However there are some general instructions for building metaworld.

### Requirements
All the metaworld components have the following requirements

- `nodejs`
- `npm`

Before trying to build any component one should always install the required
packages by running `npm install` in the directory of the component one is trying to build.
