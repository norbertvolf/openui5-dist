"use strict";

const request = require("request");
const jsdom = require("jsdom");
const _ = require("lodash");
const npm = require("../lib/npm");
const semver = require("semver");
const JsDOM = jsdom.JSDOM;

module.exports.readReleasedVersions = function() {
    return new Promise((resolve, reject) => {
        request("https://openui5.org/releases/", function(error, response, body) {
            let dom;
            if (error) {
                reject(error);
            } else {
                dom = new JsDOM(body);
                resolve(
                    _.chain(dom.window.document.querySelectorAll("div.table > div.table__row > div:first-child"))
                        .map(div => div.textContent)
                        .filter(version => semver.valid(version))
                        .value()
                );
            }
        });
    });
};

module.exports.determineVersionsToInstall = function() {
    return Promise.all([npm.packageVersions(), module.exports.readReleasedVersions()]).then(results => {
        let npmVersions = results[0];
        let releaseVersions = results[1];
        return Promise.resolve(
            _.chain(releaseVersions)
                .map(releaseVersion => {
                    return {
                        releaseVersion: releaseVersion,
                        npmVersions: _.filter(npmVersions, npmVersion =>
                            semver.satisfies(
                                npmVersion,
                                `~${semver.major(releaseVersion)}.${semver.minor(releaseVersion)}.x`
                            )
                        )
                    };
                })
                .filter(
                    comparedVersionInfo =>
                        comparedVersionInfo.npmVersions.length === 0 ||
                        semver.gt(comparedVersionInfo.releaseVersion, _.last(comparedVersionInfo.npmVersions))
                )
                .map(comparedVersionInfo => comparedVersionInfo.releaseVersion)
                .value()
        );
    });
};
