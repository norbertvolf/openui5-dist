"use strict";

const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const WORKING_DIRECTORY_PATH = path.join(require("os").homedir(), ".openui5-dist");

module.exports.workingDirectory = function() {
    if (!fs.existsSync(WORKING_DIRECTORY_PATH)) {
        fs.mkdirSync(WORKING_DIRECTORY_PATH);
    }
    return WORKING_DIRECTORY_PATH;
};

module.exports.deleteDirectoryRecursively = function(pathToRemove) {
    function deleteRecursively(pathToDelete) {
        if (fs.existsSync(pathToDelete)) {
            fs.readdirSync(pathToDelete).forEach(function(file) {
                var curPath = pathToDelete + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    // recurse
                    deleteRecursively(curPath);
                } else {
                    // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(pathToDelete);
        }
    }

    return new Promise(function(resolve) {
        process.nextTick(() => {
            deleteRecursively(pathToRemove);
            resolve();
        });
    });
};

module.exports.cleanUpDistDirectory = function() {
    let distPath = path.join(__dirname, "../", "dist");
    return Promise.all(
        fs.readdirSync(distPath).map(file => {
            let promise = Promise.resolve();
            let filePath = path.join(distPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                promise = module.exports.deleteDirectoryRecursively(filePath);
            } else if (file !== ".place") {
                fs.unlinkSync(filePath);
            }
            return promise;
        })
    );
};

module.exports.readJSON = function(filePath) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, "utf8", function(err, content) {
            if (err) {
                reject(`Can not read JSON file ${filePath}: ${err}`);
            }
            if (!content) {
                reject(`Content of ${filePath} is empty. Initialize it with empty object.`);
            } else {
                try {
                    resolve(JSON.parse(content));
                } catch (parseError) {
                    reject(`Can not parse config file ${filePath}: ${parseError}`);
                }
            }
        });
    });
};

module.exports.writeJSON = function(content, filePath, spacer = 2) {
    return new Promise((resolve, reject) => {
        try {
            fs.writeFile(filePath, JSON.stringify(content, null, spacer), err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports.changeVersionInPackageJSON = function(version) {
    let pathPackageJSON = path.join(__dirname, "..", "package.json");
    return module.exports.readJSON(pathPackageJSON).then(packageJSONContent => {
        _.set(packageJSONContent, "version", version);
        return module.exports.writeJSON(packageJSONContent, pathPackageJSON);
    });
};
