var fs = require('fs');
var BaguetteVM = require('../src/vm/baguette-vm').BaguetteVM;

let gameStats = {
  a: 1,
  b: 2,
  c: 3,
};

let gameFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};

let filename = 'if';
let content = fs.readFileSync(`${filename}.bic`, 'utf8');
let baguetteVM = new BaguetteVM(content, gameStats, gameFuncs);
let result = baguetteVM.runFunc('main');
