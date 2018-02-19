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
    game.a.a1.a11 = game.b;
    game.b = (1 + 2) * 4 / 3 - 5;
    game.c = game.a.a2;

    return game.b;
  }
`;

let baguetteCompiler = new BaguetteCompiler(src);
let interCode = baguetteCompiler.generateIntermediateCode();
let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
let result = baguetteVM.runFunc('main');
console.log(result);