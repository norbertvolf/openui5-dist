"use strict";

const WORKING_DIRECTORY = "/tmp/openui5";
const DEBUG = false;
const git = require('simple-git')();
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const Zip = require('adm-zip');

var config;

readConfiguration()
	.then(cloneRepository)
	.then(checkoutToOpenUI5Version)
	.then(installOpenUI5Dependencies)
	.then(buildOpenUI5)
	.then(compressOpenUI5)
	.then(cleanUpDistDirectory)
	.then(createResourcesOpenUI5)
	.then(cleanUpWorkingDirectory)
	.catch((err) => {
		console.error(err);
	});

function readConfiguration() {
	console.log("Read configuration file.");
	var executor = function(resolve, reject) {
		fs.readFile("package.json", "utf8", function(err, content) {
			if (err) {
				reject(`Can not read config file ${fileName}: ${err}`);
			}
			if (!content) {
				reject(`Content of ${fileName} is empty. Initialize it with empty object.`);
			} else {
				try {
					config = JSON.parse(content);
					resolve(config);
				} catch (parseError) {
					reject(`Can not parse config file ${fileName}: ${parseError}`);
				}
			}
		});
	};

	return new Promise(executor);
};

function cloneRepository () {
	var executor = function(resolve, reject) {
		console.log(`Cloning OpenUI5 repository to the ${WORKING_DIRECTORY}`);
		git.clone("https://github.com/SAP/openui5.git", WORKING_DIRECTORY, (err) => {
			if ( err ) {
				reject(err)
			} else {
				resolve();
			}
		});
	};

	return new Promise(executor);
}

function checkoutToOpenUI5Version () {
	git.cwd(WORKING_DIRECTORY);
	var executor = function(resolve, reject) {
		if ( config.version.match(/^\d+\.\d+\.\d+$/) !== null) {
			console.log(`Checkout to tag ${config.version}`);
			git.checkout(config.version, ( err ) => {
				if ( err ) {
					reject(err)
				} else {
					resolve();
				}
			})
		} else {
			console.log(`Invalid OpenUI5 version ${config_version}`);
		}
	};
	return new Promise(executor);
}

function installOpenUI5Dependencies () {
	var child;
	console.log(`Install OpenUI5 dependencies in ${WORKING_DIRECTORY} directory.`);
	var executor = function(resolve, reject) {
		child = exec(
			'npm install', {
				cwd : WORKING_DIRECTORY
			},
			function (err, stdout, stderr) {
				if ( DEBUG ) {
					console.log("======================= NPM OUTPUT =======================");
					console.log(stdout);
					console.log(stderr);
					console.log("==========================================================");
				}
				if (err !== null) {
					reject(err);
				} else {
					resolve();
				}
			}
		);

	};
	return new Promise(executor);
}

function buildOpenUI5 () {
	var child;
	console.log(`Build OpenUI5 ${config.version}.`);
	var executor = function(resolve, reject) {
		child = exec(
			'/usr/local/bin/grunt build', {
				cwd : WORKING_DIRECTORY
			},
			function (err, stdout, stderr) {
				if ( DEBUG ) {
					console.log("====================== GRUNT OUTPUT ======================");
					console.log(stdout);
					console.log(stderr);
					console.log("==========================================================");
				}
				if (err !== null) {
					reject(err);
				} else {
					resolve();
				}
			}
		);
	};
	return new Promise(executor);
}

function compressOpenUI5 () {
	var child;
	console.log(`Compress OpenUI5 ${config.version}.`);
	var executor = function(resolve, reject) {
		child = exec(
			'/usr/local/bin/grunt compress', {
				cwd : WORKING_DIRECTORY
			},
			function (err, stdout, stderr) {
				if ( DEBUG ) {
					console.log("====================== GRUNT OUTPUT ======================");
					console.log(stdout);
					console.log(stderr);
					console.log("==========================================================");
				}
				if (err !== null) {
					reject(err);
				} else {
					resolve();
				}
			}
		);
	};
	return new Promise(executor);
}

function createResourcesOpenUI5() {
	console.log(`Create resources for version OpenUI5 ${config.version}.`);
	var zipFile;

	var executor = function(resolve, reject) {
		zipFile = new Zip(path.join(WORKING_DIRECTORY, "target", "openui5.zip"));
		zipFile.extractAllTo(path.join("./", "dist"), true);
	};

	return new Promise(executor);
}

function deleteDirectory(pathToRemove) {
	function deletePathRecurively(pathToDelete) {
		if (fs.existsSync(pathToDelete)) {
			fs.readdirSync(pathToDelete).forEach(function(file) {
				var curPath = pathToDelete + "/" + file;
				if (fs.lstatSync(curPath).isDirectory()) { // recurse
					deletePathRecurively(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(pathToDelete);
		}
	}

	console.log(`Clean up ${pathToRemove} directory.`);
	var executor = function(resolve) {
		process.nextTick(() => {
			deletePathRecurively(pathToRemove);
			resolve();
		});
	};
	return new Promise(executor);
};

function cleanUpWorkingDirectory() {
	return deleteDirectory(WORKING_DIRECTORY);
};

function cleanUpDistDirectory() {
	return Promise.all(fs.readdirSync(path.join("./", "dist")).map((file) => {
		return(deleteDirectory(file));
	}));
};
