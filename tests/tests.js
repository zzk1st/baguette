const ava = require('ava');
const BaguetteCompiler = require('../src/compiler/baguette-compiler').BaguetteCompiler;
const BaguetteVM = require('../src/vm/baguette-vm').BaguetteVM;

let envFuncs = {
  print: {
    pauseAfterComplete: false,
    funcImp: (text) => console.log(text),
  }
};

function runScript(envVars, tranche /* means 'a piece of baguette'*/) {
  let baguetteCompiler = new BaguetteCompiler(tranche);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');
  return result;
}

//----------------------------------------------------------------------------
// EXPRESSION TEST
//----------------------------------------------------------------------------
// Expressions support arithmetic, comparision, and logic operations.
//----------------------------------------------------------------------------
ava.test('EXPRESSION TEST', t => {
  let envVars = {};
  let result = runScript(envVars, `
    function main()
    {
      a = 0;
      b = 1;
      if (!a)
      {
        if (a==0 && b==1)
        {
          if (a==1 || b == 1)
          {
            if (!a==1 && b == 0+1)
            {
              a = b == 1;
            }
          }
        }
      }

      return a;
    }
  `);

  t.deepEqual(result, true);
});

//----------------------------------------------------------------------------
// IF ELSE TEST
//----------------------------------------------------------------------------
// Like if-else in any other language
//----------------------------------------------------------------------------
ava.test('IF ELSE TEST', t => {
  let envVars = {};
  let result = runScript(envVars, `
    function main()
    {
      a = 1;
      if (a == 1) {
        result = true;
      } else {
        result = false;
      }
      return result;
    }
  `);

  t.deepEqual(result, true);
});

//----------------------------------------------------------------------------
// LOCAL VARIABLE TEST
//----------------------------------------------------------------------------
// Local variables (LV) are variables in the scope of a function. They can be 
// defined directly by assignments like 'var_name = [value];'.
//
// Pay attention that LV's lifetime is not a block (code in {}). That means if
// you define a LV in a block, it will stay in the whole function.
//
// Local varialbes only support basic types including integer, string, bool,
// and float. They don't support object-like types.
//----------------------------------------------------------------------------
ava.test('LOCAL VARIABLE TEST', t => {
  let envVars = {};
  let result = runScript(envVars, `
    function main()
    {
      a = 1;
      if (a == 1)
      {
        b = "yes";
      }
      if (b == "yes")
      {
        c = 0.5;
      }
      return c;
    }
  `);

  t.deepEqual(result, 0.5);
});

//----------------------------------------------------------------------------
// FUNCTION TEST
//----------------------------------------------------------------------------
// Functions can be defined in the form of 'function [func_name] (params) {}'.
// You can call functions like func_name(param1, param2, ...), like in other
// languages.
//
// Function parameters only support primitive types like int, string, bool and
// float.
//----------------------------------------------------------------------------
ava.test('FUNCTION TEST', t => {
  let envVars = {};
  let result = runScript(envVars, `
    function max(a, b)
    {
      if (a > b)
      {
        return a;
      }
      else
      {
        return b;
      }
    }

    function main()
    {
      return max(max(max(max(1, 2), 3), 4), 5);
    }
  `);

  t.deepEqual(result, 5);
});

//----------------------------------------------------------------------------
// ENV VARIABLE TEST
//----------------------------------------------------------------------------
// Environment variables are defined by the host, and can be used in the code 
// in the form of 'game.[env_name]'.
//
// You can also define complex javascript object in environment variables. And
// they can be accessed in the form of foo.bar.xxx (see the tranche below)
//----------------------------------------------------------------------------
ava.test('ENV VARIABLE TEST', t => {
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

  let result = runScript(envVars, `
    function main()
    {
      game.a.a1.a11 = game.b;
      game.b = (1 + 2) * 4 / 3 - 5;
      game.c = game.a.a2;

      return game.b;
    }
  `);

  t.deepEqual(result, -1);
  t.deepEqual(envVars.a.a1.a11, 0.5);
  t.deepEqual(envVars.b, -1);
  t.deepEqual(envVars.c, "str");
});

//----------------------------------------------------------------------------
// PAUSE & CONTINUE TEST
//----------------------------------------------------------------------------
// If you set the pauseAfterComplete property of an environment function to 
// true, the VM will pause when it meets the calling of this function. And you
// can manually continue by running continue(returnValue).
//
// This function is used a lot in UI functions. Let's say you are displaying a
// dialog text and you want user to touch the screen before you display the 
// next line. So you can set a displayText() and ask the VM to pause when it's 
// called, and continue only when the system detect a touch event.
//----------------------------------------------------------------------------
ava.test('PAUSE & CONTINUE TEST', t => {
  let envVars = {};

  envFuncs.print.pauseAfterComplete = true;
  let baguetteCompiler = new BaguetteCompiler(`
    function main()
    {
      a = 1;
      b = game.print("pause function!");
      return b;
    }
  `);
  let interCode = baguetteCompiler.generateIntermediateCode();

  let baguetteVM = new BaguetteVM(interCode, envVars, envFuncs);
  let result = baguetteVM.runFunc('main');
  let finalResult = baguetteVM.continue(3);

  t.deepEqual(finalResult, 3);
});