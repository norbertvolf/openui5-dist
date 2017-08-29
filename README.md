# openui5-dist

The package contains OpenUI5 framework packaged for NPM and the
script for the building the [OpenUI5](http://openui5.org/) framework for
NPM package. The openui5-dist does not touch openui5 content. Just
package it for distribution via NPM.

OpenUI5 is open-source part of SAPUI5 framework which is used
to build SAP Fiory application. You can freely use [OpenUI5](http://openui5.org/) framework
in your projects.

## Use it  for building OpenUI5 application

Install *openui5-dist* package in your project

```
npm install openui5-dist

```

And then serve the OpenUI5 file from NPM package.

Example for express


```
const app = express();

//Path to example application
app.use(express.static("./public/"));

//Path to openui5
app.use(express.static("./node_modules/openui5-dist/dist/"));

//Start web server
app.listen("3000", function() {
	    console.log("Listening on port %d", "3000");
});

```

### Example application

I have created the example application which uses OpenUI5
framework packaged by the *openui5-dist* package.

To use the application clone repository

```
git clone https://github.com/norbertvolf/openui5-dist-example.git
```
Install dependencies

```
cd openui5-dist-example
npm install
```

Run web server

```
npm start
```

And open the [http://localhost:3000/index.js](http://localhost:3000/index.js) in your browser;

## Use it to build your own OpenUI5 distribution

You can use index.js to prepare OpenUI5 distribution and then use it.  The script
clone openui5 repository to the working directory and then build the OpenUI5.
When OpenUI5 is ready It copies the OpenUI5 files to the dist directory of the
project and You can use `npm publish` to upload the openui5 files to the npm registry.

I have tested the script only on my linux machine.

### Create your own openui5 distribution

```
git clone git@github.com:norbertvolf/openui5-dist.git
cd openui5-dist
npm install
```

Update version in the package.json by corresponding version of OpenUI5 framework and
run the script for building the OpenUI5 distribution.

```
node index.js
```
