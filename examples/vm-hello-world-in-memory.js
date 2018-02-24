var fs = require('fs');
var BaguetteCompiler = require('../src/compiler/baguette-compiler').BaguetteCompiler;
var BaguetteVM = require('../src/vm/baguette-vm').BaguetteVM;

let envFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};

/*
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
  function max(a, b)
  {
    if (a > b)
    {
      d = a;
    }
    else
    {
      d = b;
    }

    return d;
  }

  function main()
  {
    if (max(max(1, 2), 3) == 3)
    {
      game.print("yes");
      return true;
    }
   game.print("no");
    return false;
  }
`;
*/
let envVars = {
  a: {
    a1: {
      a11: 1
    },
    a2: "str"
  },
  b: 0.5,
  c: ""
};

let src=`
  function main()
  {
    a = 4;
    if (a == 1) {
      game.print("1");
    } else if (a == 2) {
      game.print("2");
    } else if (a == 3) {
      game.print("3");
    } else {
      game.print("4");
      game.print("5");
    }
  }
`;

let baguetteCompiler = new BaguetteCompiler(src);
let interCode = baguetteCompiler.generateIntermediateCode();
let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
let result = baguetteVM.runFunc('main');
console.log(result);