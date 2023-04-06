"use strict";

const npm = require("npm");
const _ = require("lodash");
const path = require("path");
const directories = require("./filesystem");

let workingDirectory = directories.workingDirectory();
let viewJSONPromise;

module.exports.run = function (directoryToRun, command, ...args) {
  return new Promise((resolve, reject) => {
    npm.load(
      {
        loaded: false,
        prefix: directoryToRun,
        loglevel: "silent",
        progress: false,
      },
      function (err) {
        if (err) {
          reject(err);
        } else {
          if (!_.isFunction(npm.commands[command])) {
            reject(new Error(`Command ${command} does not exists.`));
          } else if (command === "show") {
            npm.commands[command](args, true, (errCommand, data) => {
              if (errCommand) {
                reject(errCommand);
              } else {
                resolve(data);
              }
            });
          } else {
            npm.commands[command](args, (errCommand) => {
              if (errCommand) {
                reject(errCommand);
              } else {
                resolve();
              }
            });
          }
        }
      }
    );
  });
};

module.exports.packageVersions = function () {
  return module.exports.packageViewJSON().then((data) =>
    _.chain(data)
      .keys()
      .map((key) => _.get(data[key], "versions", []))
      .reduce((acc, vers) => _.concat(acc, vers), [])
      .value()
  );
};

module.exports.latestVersion = function () {
  return module.exports.packageViewJSON().then((data) => {
    return _.chain(data).keys().last().value();
  });
};

module.exports.packageViewJSON = function () {
  if (!viewJSONPromise) {
    viewJSONPromise = module.exports.run(
      workingDirectory,
      "show",
      "openui5-dist"
    );
  }
  return viewJSONPromise;
};

module.exports.cleanupModules = function () {
  return directories.deleteDirectoryRecursively(
    path.join(workingDirectory, "node_modules")
  );
};

module.exports.installPackages = function () {
  return module.exports.run(workingDirectory, "install");
};

module.exports.publishPackage = function () {
  return module.exports.run(path.join(__dirname, ".."), "publish");
};

module.exports.markAsLatestVersion = function (version) {
  return module.exports.run(
    path.join(__dirname, ".."),
    "dist-tag",
    "add",
    `openui5-dist@${version}`,
    "latest"
  );
};
