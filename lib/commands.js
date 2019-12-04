"use strict";

const directories = require("./filesystem");
const exec = require("child_process").exec;
const Zip = require("adm-zip");
const path = require("path");

let workingDirectory = directories.workingDirectory();

module.exports.grunt = function(taskName) {
    return new Promise(function(resolve, reject) {
        exec(
            `/usr/bin/npx grunt ${taskName}`,
            {
                cwd: workingDirectory
            },
            function(err, stdout, stderr) {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve([stdout, stderr]);
                }
            }
        );
    });
};

module.exports.extractResources = function() {
    let zipFile = new Zip(path.join(workingDirectory, "target", "openui5.zip"));
    zipFile.extractAllTo(path.join("./", "dist"), true);
};
