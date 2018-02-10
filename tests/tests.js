const ava = require('ava');
const BaguetteCompiler = require('../src/compiler/baguette-compiler').BaguetteCompiler;
const BaguetteVM = require('../src/vm/baguette-vm').BaguetteVM;

let envFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};
//-------------------------------------------
// OPERATORS & ASSIGNMENT TEST
//-------------------------------------------
ava.test('operator & assignment test', t => {
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
  let baguetteCompiler = new BaguetteCompiler(`
    function main()
    {
      a.a1.a11 = b;
      b = (1 + 2) * 4 / 3 - 5;
      c = a.a2;

      return b;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');

  t.deepEqual(result, -1);
  t.deepEqual(envVars.a.a1.a11, -1);
  t.deepEqual(envVars.b, -1);
  t.deepEqual(envVars.c, "str");
});

//-------------------------------------------
// IFELSE TEST
//-------------------------------------------
ava.test('ifelse test', t => {
  let envVars = {
    a: 1,
    b: 2,
  };
  let baguetteCompiler = new BaguetteCompiler(`
    function main()
    {
      a = 1;
      if (a == 1) {
        b = 2;
      } else {
        b = 3;
      }
      return b;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');

  t.deepEqual(result, 2);
});

//-------------------------------------------
// EXPRESSION TEST
//-------------------------------------------
ava.test('expression test', t => {
  let envVars = {
    a: 0,
    b: 1,
  };
  let baguetteCompiler = new BaguetteCompiler(`
    function main()
    {
      if (!a)
      {
        if (a==0 && b==1)
        {
          if (a==1 || b == 1)
          {
            if (!a==1 && b == 0+1)
            {
              a = b== 1;
            }
          }
        }
      }

      return a;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');

  t.deepEqual(result, true);
});

//-------------------------------------------
// PAUSE & CONTINUE TEST
//-------------------------------------------
ava.test('ifelse test', t => {
  let envVars = {
    a: 1,
    b: 2,
  };

  envFuncs.print.pauseAfterComplete = true;
  let baguetteCompiler = new BaguetteCompiler(`
    function main()
    {
      a = 1;
      b = print("pause function!");
      return b;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');
  let finalResult = baguetteVM.continue(3);

  t.deepEqual(finalResult, 3);
});