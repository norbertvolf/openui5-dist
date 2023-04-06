"use strict";

const directories = require("./filesystem");
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs").promises;
const existsFile = require("fs").existsSync;

let workingDirectory = directories.workingDirectory();

exports.grunt = function (taskName) {
  return new Promise(function (resolve, reject) {
    exec(
      `/usr/bin/npx grunt ${taskName}`,
      {
        cwd: workingDirectory,
      },
      function (err, stdout, stderr) {
        if (err !== null) {
          reject(err);
        } else {
          resolve([stdout, stderr]);
        }
      }
    );
  });
};

exports.mergeBuiltLibraries = function () {
  const builtLibrariesPath = path.join(workingDirectory, "target");
  const destinationPath = path.join("./", "dist");

  return fs.readdir(builtLibrariesPath).then((dirlist) => {
    Promise.all(
      dirlist.map(
        (dirName) =>
          exports.mergeContent(
            path.join(builtLibrariesPath, dirName),
            destinationPath,
            ""
          ),
        ""
      )
    );
  });
};

exports.mergeContent = function (libraryPath, destinationPath, contentPath) {
  const contentFullPath = path.join(libraryPath, contentPath);

  return fs.stat(contentFullPath).then((contentStat) => {
    let promise;

    if (contentStat.isDirectory()) {
      promise = fs
        .readdir(contentFullPath)
        .then((contentlist) =>
          Promise.all(
            contentlist.map((subContentPath) =>
              exports.mergeContent(
                libraryPath,
                destinationPath,
                path.join(contentPath, subContentPath)
              )
            )
          )
        );
    } else {
      promise = exports.copyContent(libraryPath, destinationPath, contentPath);
    }

    return promise;
  });
};

exports.copyContent = function (libraryPath, destinationPath, contentPath) {
  const sourceFullPath = path.join(libraryPath, contentPath);
  const destinationFullPath = path.join(destinationPath, contentPath);
  const destinationDirectory = path.dirname(destinationFullPath);

  return (
    existsFile(destinationDirectory)
      ? Promise.resolve(false)
      : fs.mkdir(destinationDirectory, { recursive: true })
  ).then(() => fs.copyFile(sourceFullPath, destinationFullPath));
};
