"use strict";

const versions = require("../lib/versions");
const git = require("../lib/git");
const npm = require("../lib/npm");
const commands = require("../lib/commands");
const filesystem = require("../lib/filesystem");
const _ = require("lodash");

Promise.all([versions.determineVersionsToInstall(), git.initialize()])
    .then(results => {
        let versionsToInstall = results[0];
        return _.reduce(
            versionsToInstall,
            (promise, version) => {
                return promise
                    .then(() => {
                        filesystem.changeVersionInPackageJSON(version);
                        return git.changeVersion(version);
                    })
                    .then(() => {
                        console.log(`Switched to version ${version}.`);
                        return npm.cleanupModules();
                    })
                    .then(() => {
                        console.log("Cleaned up modules directory.");
                        return npm.installPackages();
                    })
                    .then(() => {
                        console.log("Node packages installed.");
                        return commands.grunt("build");
                    })
                    .then(() => {
                        console.log(`Built OpenUI5 ${version}.`);
                        return filesystem.cleanUpDistDirectory();
                    })
                    .then(() => {
                        console.log(`Merge OpenUI5 ${version} libraries merged to one distribution.`);
                        return commands.mergeBuiltLibraries();
                    })
                    .then(() => {
                        console.log(`OpenUI5 ${version} is ready.`);
                        return npm.publishPackage();
                    })
                    .then(() => {
                        console.log(`OpenUI5 ${version} is published.`);
                    });
            },
            Promise.resolve()
        );
    })
    .then(() => versions.readLatestVersion())
    .then(latestVersion => {
        let promise = Promise.resolve();
        if (latestVersion) {
            console.log(`Mark latest version to ${latestVersion}`);
            promise = npm.markAsLatestVersion(latestVersion);
        }
        return promise;
    })
    .catch(console.error);
