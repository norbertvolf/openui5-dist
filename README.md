# OpenUI5 Dist

The script which prepare OpenUI5 package for the NPM registry.  The script
clone openui5 repository to the working directory and then build the OpenUI5.
When OpenUI5 is ready It copies the OpenUI5 files to the dist directory of the
project and `npm publish` upload the openui5 files to the npm registry.

# Version

Version in package.json responds version of OpenUI5

# Usage

```
node index.js
```




