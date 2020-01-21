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
        let currentVersion;
        return _.reduce(
            versionsToInstall,
            (promise, version) => {
                return promise
                    .then(() => {
                        currentVersion = version;
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
                        console.log("OpenUI5 built.");
                        return commands.grunt("compress");
                    })
                    .then(() => {
                        console.log("OpenUI5 compressed.");
                        return filesystem.cleanUpDistDirectory();
                    })
                    .then(() => {
                        console.log("Dist directory is ready.");
                        commands.extractResources();
                        console.log("UI5 distribution files is ready.");
                        return npm.publishPackage();
                    })
                    .then(() => {
                        return versions.readLatestVersion();
                    })
                    .then(latestVersion => {
                        return npm.markAsLatestVersion(latestVersion);
                    })
                    .then(() => {
                        console.log(`UI5 ${currentVersion} is published.`);
                    });
            },
            Promise.resolve()
        );
    })
    .catch(console.error);
