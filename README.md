# Candidate


This project is an *exercise*.

## Getting started

#### Prerequisites

As we're using a number of node.js tools. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).


#### Install dependencies

We have two kinds of dependencies in this project: tools and AngularJS framework code.  The tools help
us manage and test the application.

* We get the tools we depend upon via `npm`, the [node package manager][npm].
* We get the AngularJS code via `bower`, a [client-side code package manager][bower].

We have preconfigured `npm` to automatically run `bower` so you can simply do:

```
npm install
```

### Source compilation

I use gulp to compile angular modules. Each modules (folder) are compiler separately in a single file named as module folder and dropped in the 'dist' folder.

You can install gulp globally :

```
npm install -g gulp
```

This allow a better module separation, a quicker javascript file addition in the app, and the furure possibility to obfuscate files or use transpilers (babel, React jsx...) or other build tools.

There is only one default task, so just run gulp command at project root

```
gulp
```

### Data & server API

I use mocked up data for testing. The [post] /candidate end point has a randow fail of 20% to simulate server failure handling.

### Running the App during Development

The project comes pre-configured with a local development web server.  It is a node.js
tool called [live-server][live-server].  You can install live-server globally :

```
npm install -g live-server
```

Then you can start your own development web server to serve static files from a folder by running:

```console
cd ./app
live-server
```
You'll see instructions on how you need to proceed further.

## Contact

For more information on AngularJS please check out http://angularjs.org/

[git]: http://git-scm.com/
[bower]: http://bower.io
[npm]: https://www.npmjs.org/
[node]: http://nodejs.org
[live-server]: https://github.com/tapio/live-server
