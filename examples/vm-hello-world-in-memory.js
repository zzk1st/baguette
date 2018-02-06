var fs = require('fs');
var BaguetteCompiler = require('../src/compiler/baguette-compiler').BaguetteCompiler;
var BaguetteVM = require('../src/vm/baguette-vm').BaguetteVM;

let envFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};
let envVars = {
  a: {
    a1: {
      a11: 1
    },
    a2: "str"
  },
  b: -1,
  c: ""
};
let src = `
  function main()
  {
    a.a1.a11 = b;
    b = (1 + 2) * 4 / 3 - 5;
    c = a.a2;

    return a;
  }
`;
let baguetteCompiler = new BaguetteCompiler(src);
let interCode = baguetteCompiler.generateIntermediateCode();
let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
let result = baguetteVM.runFunc('main');