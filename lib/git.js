"use strict";

const simpleGit = require("simple-git");
const semver = require("semver");
const directories = require("./filesystem");

const OPENUI_REPO_URL = "https://github.com/SAP/openui5.git";

let workingDirectory = directories.workingDirectory();
let git = simpleGit(workingDirectory);

module.exports.initialize = function() {
    return git.checkIsRepo().then(isRepo => {
        let promise;
        if (isRepo) {
            promise = git.fetch();
        } else {
            promise = git.clone(OPENUI_REPO_URL, workingDirectory);
        }
        return promise;
    });
};

module.exports.changeVersion = function(version) {
    let promise;
    if (semver.valid(version)) {
        promise = git.checkout(version);
    } else {
        promise = Promise.reject(new Error(`Invalid OpenUI5 version ${version}`));
    }
    return promise;
};
