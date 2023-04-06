"use strict";

const request = require("request");
const _ = require("lodash");
const npm = require("../lib/npm");
const semver = require("semver");

module.exports.readReleasedVersions = function () {
  return new Promise((resolve, reject) => {
    request(
      "https://openui5.org/page-data/releases/page-data.json",
      function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          try {
            resolve(
              _.chain(JSON.parse(body))
                .get("result.data.allVersionsJson.edges")
                .map((versionData) => _.get(versionData, "node.version"))
                .filter((version) => semver.valid(version))
                .value()
            );
          } catch (err) {
            reject(err);
          }
        }
      }
    );
  });
};

module.exports.readLatestVersion = function () {
  return Promise.all([npm.packageVersions(), npm.latestVersion()]).then(
    (results) => {
      const npmVersions = results[0];
      const latestVersion = results[1];
      const foundLatestVersion = _.chain(npmVersions)
        .sortBy(
          (version) =>
            semver.major(version) * 100 +
            semver.minor(version) * 10 +
            semver.patch(version) * 1
        )
        .last()
        .value();
      return foundLatestVersion === latestVersion ? undefined : latestVersion;
    }
  );
};

module.exports.determineVersionsToInstall = function () {
  return Promise.all([
    npm.packageVersions(),
    module.exports.readReleasedVersions(),
  ]).then((results) => {
    let npmVersions = results[0];
    let releaseVersions = results[1];
    let versionsToInstall = _.chain(releaseVersions)
      .map((releaseVersion) => {
        return {
          releaseVersion: releaseVersion,
          npmVersions: _.filter(npmVersions, (npmVersion) =>
            semver.satisfies(
              npmVersion,
              `~${semver.major(releaseVersion)}.${semver.minor(
                releaseVersion
              )}.x`
            )
          ),
        };
      })
      .filter(
        (comparedVersionInfo) =>
          comparedVersionInfo.npmVersions.length === 0 ||
          semver.gt(
            comparedVersionInfo.releaseVersion,
            _.last(comparedVersionInfo.npmVersions)
          )
      )
      .map((comparedVersionInfo) => comparedVersionInfo.releaseVersion)
      .value();
    return versionsToInstall;
  });
};
