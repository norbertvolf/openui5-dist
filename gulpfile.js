"use strict";

const { watch, dest, src, series } = require("gulp");
const prettier = require("gulp-prettier");
const eslint = require("gulp-eslint");

const JS_FILES = ["./bin/*.js", "./lib/**/*.js", "gulpfile.js"];

function runLinter() {
    return src(JS_FILES)
        .pipe(
            eslint({
                configFile: ".eslintrc",
                rules: {}
            })
        )
        .pipe(eslint.format());
}

function runPrettier() {
    return src(JS_FILES)
        .pipe(
            prettier({
                tabWidth: 4,
                quoteProps: "consistent",
                printWidth: 120,
                endOfLine: "lf"
            })
        )
        .pipe(dest(file => file.base));
}

function runNodeWatch(done) {
    watch(
        JS_FILES,
        {
            usePolling: true,
            interval: 500
        },
        series(runPrettier, runLinter)
    );
    done();
}

exports.default = series(runPrettier, runLinter);
exports.watch = runNodeWatch;
