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
  let envVars = {a: 1};
  let baguetteCompiler = new BaguetteCompiler(`
    int main()
    {
      a = (1 + 2) * 4 / 3 - 5;
      return a;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');

  t.deepEqual(result, -1);
  t.deepEqual(envVars.a, -1);
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
    int main()
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
// PAUSE & CONTINUE TEST
//-------------------------------------------
ava.test('ifelse test', t => {
  let envVars = {
    a: 1,
    b: 2,
  };

  envFuncs.print.pauseAfterComplete = true;
  let baguetteCompiler = new BaguetteCompiler(`
    int main()
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