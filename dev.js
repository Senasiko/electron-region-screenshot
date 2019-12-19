const rollup = require('rollup');
const electron = require('electron');
const { spawn } = require('child_process');
const configs = require('./rollup.config');

let exampleProcess = null;

let nowWaiting = null;

let configStatus = {};

function hasError() {
  return Object.values(configStatus).includes(false)
}

function startElectron() {
  exampleProcess = spawn(electron, ['--enable-logging', './example/main.js']);
  exampleProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  })
}

function startExample() {
  if (hasError()) return;
  if (exampleProcess) {
    process.kill(exampleProcess.pid);
    nowWaiting = Math.random();
    const waiting = nowWaiting;
    setTimeout(() => {
      if (nowWaiting === waiting) startElectron();
    }, 300)
  } else startElectron();
}

async function rollupBuild(options) {
  const watcher = rollup.watch(options);
  configStatus[options.input] = false;
  watcher.on('event', (event) => {
    switch (event.code) {
      case 'END': 
        configStatus[options.input] = true; 
        if (!hasError()) {
          startExample(); 
        }
      break;
      case 'ERROR': console.log(event.error); configStatus[options.input] = false; break;
    }
  });
}

function start() {
  configs.forEach(rollupBuild)
}
start();
