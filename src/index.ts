import 'electron';

if (process.type === 'browser' || process.type === 'main') module.exports = require('./mainProcess');
else module.exports = require('./rendererProcess');
