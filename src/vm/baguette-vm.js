const State = {
  NotStarted: 0,
  Running: 1,
  Paused: 2,
  Complete: 3,
};

const InvalidStackPointer = -666;
const EnvVarFuncPrefix = 'game.';

class BaguetteVM {
  constructor(content, envVars, envFuncs) {
    // static properties
    this.content = content;
    this.instructions = [];
    this.envVars = envVars;
    this.envFuncs = envFuncs;
    this.tags = {};
    this.funcEntries = {};
    // dynamic properties
    this._stack = [];
    this._stackPointer = InvalidStackPointer; // means this is the top level function call
    this._nextFuncParams = {};
    this._instrPointer = 0;

    this._state = State.NotStarted;
    this._returnValue = undefined;

    this._debugMode = false;

    this.decodeInstructions();
    this.collectSymbolTables();
  }

  ///////////////////////////////////////////////
  // Public Functions
  ///////////////////////////////////////////////
  get state() {
    return this._state;
  }

  runFunc(funcName) {
    // clear all the context
    this._stack = [];
    this._stackPointer = InvalidStackPointer;  // means this is the top level function call
    this._nextFuncParams = {};
    this._state = State.Running;
    this._returnValue = undefined;

    this.initFuncFrame();
    this.gotoFunc(funcName);

    return this.run();
  }

  continue(returnValue) {
    if (this._state != State.Paused) {
      throw new Error('Try to continue when vm is not running!');
    }

    this._stack.push(returnValue);
    this._state = State.Running;
    return this.run();
  }

  ///////////////////////////////////////////////
  // Instruction-related Operations
  ///////////////////////////////////////////////
  setInstrPos(pos) {
    this._instrPointer = pos;
  }

  incInstrPos() {
    this._instrPointer++;
  }

  gotoFunc(funcName) {
    var pos = this.funcEntries[funcName];
    if (pos == undefined) {
      throw new Error(`Cannot find function ${funcName}!`);
    }

    this.setInstrPos(pos);
  }

  ///////////////////////////////////////////////
  // Stack-related Operations
  ///////////////////////////////////////////////
  stackSafePop() {
    if (this._stack.length - 1 <= this._stackPointer + 3) { // if the element to pop is in current functions restricted area, then throw error
      throw new Error('stack corruption!');
    }
    return this._stack.pop();
  }

  initFuncFrame() {
    let oldStackPointer = this._stackPointer;
    this._stack.push({}); // return value, sp+0
    this._stackPointer = this._stack.length - 1;
    this._stack.push(oldStackPointer);  // last function stack pointer, sp+1
    this._stack.push(this._instrPointer);  // last function stack pointer, sp+2
    this._stack.push(this._nextFuncParams); // function params, sp+3
    this._stack.push({}); // local variables, sp+4

    this._nextFuncParams = {};
  }

  recoverLastFuncFrame() {
    let curStackPointer = this._stackPointer;
    this._stackPointer = this._stack[curStackPointer + 1];
    this._instrPointer = this._stack[curStackPointer + 2];
    while (this._stack.length - 1 > curStackPointer) {
      this.stackSafePop();
    }
  }

  ///////////////////////////////////////////////
  // Others
  ///////////////////////////////////////////////
  decodeInstructions() {
    this.content.split('\n').map(line => {
      this.instructions.push(line.split(','));
    });
    // for debug
    //this.instructions.map(instruction => console.log(instruction));
  }

  collectSymbolTables() {
    // collect tags and function entry points
    for (let i = 0; i < this.instructions.length; ++i) {
      let instruction = this.instructions[i];
      if (instruction[0] == 'tag') {
        this.tags[instruction[1]] = i;
      } else if (instruction[0] == 'function') {
        this.funcEntries[instruction[1]] = i;
      }
    }
  }

  run() {
    while (this._state == State.Running) {
      this.runOneInstruction();
      this.incInstrPos();
    }

    if (this._state == State.Complete) {
      return this._returnValue;
    } else {
      // paused
      this._state = State.Paused;
      return;
    }
  }

  runEnvFuncCall(instruction) {
    let funcName = instruction[1].replace(EnvVarFuncPrefix, '');

    if (!(funcName in this.envFuncs)) {
      throw new Error(`${funcName} is not in environment functions!`);
    }
    // yeah I know this pieces of code looks terrible 
    // but I haven't find other better soultions yet
    let func = this.envFuncs[funcName].funcImp;
    let returnValue;
    if (func.length == 0) {
      returnValue = func();
    } else if (func.length == 1) {
      var arg1 = this.stackSafePop();
      returnValue = func(arg1);
    } else if (func.length == 2) {
      var arg2 = this.stackSafePop();
      var arg1 = this.stackSafePop();
      returnValue = func(arg1, arg2);
    } else if (func.length == 3) {
      var arg3 = this.stackSafePop();
      var arg2 = this.stackSafePop();
      var arg1 = this.stackSafePop();
      returnValue = func(arg1, arg2, arg3);
    } else {
      throw new Error(`${funcName} has too many params which the vm does not support!`);
    }

    if (this.envFuncs[funcName].pauseAfterComplete) {
      // if function is stoppable, then it should be continue() who return the function value
      this._state = State.Paused;
    } else {
      // otherwise normal return
      this._stack.push(returnValue);
    }
  }

  runFuncCall(instruction) {
    let funcName = instruction[1];

    // First test if this is a host call
    if (funcName.startsWith(EnvVarFuncPrefix)) {
      return this.runEnvFuncCall(instruction);
    }

    if (!(funcName in this.funcEntries)) {
      throw new Error(`Cannot find function entry: ${funcName}!`);
    }

    this.initFuncFrame();
    this.gotoFunc(funcName);
  }

  runReturn(instruction) {
    // move return value to current top
    this._stack[this._stackPointer] = this.stackSafePop();
    // pop the stack
    this.recoverLastFuncFrame();
    // second, check if this is the last function, InvalidStackPointer means the stack has reached top frame
    if (this._stackPointer == InvalidStackPointer) {
      this._state = State.Complete;
      this._returnValue = this.stackSafePop();
    }
  }

  runPushVar(instruction) {
    let result = undefined;
    let varName = instruction[1];
    let funcParams = this._stack[this._stackPointer + 3];
    let localVars = this._stack[this._stackPointer + 4];

    if (varName in funcParams) {  // function params
      result = funcParams[varName];
    } else if (varName in localVars) {  // local variables
      result = localVars[varName];
    } else if (varName.startsWith(EnvVarFuncPrefix)) {  // env variables
      // this is an environment variable
      let fields = instruction[1].split('.');
      result = this.envVars;
      for (let i = 1; i < fields.length; ++i) {
        if (!(fields[i] in result)) {
          throw new Error(`${varName} is not in environment variables!`);
        }

        result = result[fields[i]];
      }
    }

    this._stack.push(result);
  }

  runAssign(instruction) {
    let varName = instruction[1];
    let localVars = this._stack[this._stackPointer + 4];

    let fields = varName.split('.');
    if (fields.length == 1) {
      localVars[varName] = this.stackSafePop();
    } else {
      if (!varName.startsWith(EnvVarFuncPrefix)) {
          throw new Error(`Unknown environment varialble ${varName}!`);
      }

      if (fields.length == 2) {
        if (!(fields[1] in this.envVars)) {
          throw new Error(`${varName} is not in environment variables!`);
        }
        this.envVars[fields[1]] = this.stackSafePop();
      } else {
        var envVarToAssign = this.envVars[fields[1]];
        for (let i = 2; i < fields.length - 1; ++i) {
          if (!(fields[i] in envVarToAssign)) {
            throw new Error(`${fields[i]} is not in environment variables!`);
          }
          envVarToAssign = envVarToAssign[fields[i]];
        }
        let finalField = fields[fields.length - 1];
        if (!(finalField in envVarToAssign)) {
          throw new Error(`${finalField} is not in environment variables!`);
        }
        envVarToAssign[finalField] = this.stackSafePop();
      }
    }
  }

  runOneInstruction() {
    let instruction = this.instructions[this._instrPointer];
    this.dumpInstruction(instruction);

    if (instruction[0] == 'tag') {
      // do nothing here
    //--------------------------------------
    // control flow instructions
    //--------------------------------------
    } else if (instruction[0] == 'goto') {
      if (!(instruction[1] in this.tags)) {
        throw new Error(`${instruction[1]} unknown goto tag!`);
      }
      this.setInstrPos(this.tags[instruction[1]]);
    } else if (instruction[0] == 'if_not_goto') {
      if (!(instruction[1] in this.tags)) {
        throw new Error(`${instruction[1]} unknown if_not_goto tag!`);
      }
      let condition = this.stackSafePop();
      if (!condition) {
        this.setInstrPos(this.tags[instruction[1]]);
      }
    //--------------------------------------
    // push & pop instructions
    //--------------------------------------
    } else if (instruction[0] == 'pushbool') {
      this._stack.push(instruction[1] == 'true');
    } else if (instruction[0] == 'pushnum') {
      this._stack.push(parseFloat(instruction[1]));
    } else if (instruction[0] == 'pushvar') {
      this.runPushVar(instruction);
    } else if (instruction[0] == 'pushstr') {
      this._stack.push(instruction[1]);
    } else if (instruction[0] == 'pop') {
      this.stackSafePop();
    } else if (instruction[0] == 'pop_to_params') {
      let paramName = instruction[1];
      this._nextFuncParams[paramName] = this.stackSafePop();
    //--------------------------------------
    // operator instructions
    //--------------------------------------
    } else if (instruction[0] == 'logic_not') {
      let v1 = this.stackSafePop();
      this._stack.push(!v1);
    } else if (instruction[0] == 'logic_and') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 && v2);
    } else if (instruction[0] == 'logic_or') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 || v2);
    } else if (instruction[0] == 'more') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 > v2);
    } else if (instruction[0] == 'more_or_eq') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 >= v2);
    } else if (instruction[0] == 'less') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 < v2);
    } else if (instruction[0] == 'less_or_eq') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 <= v2);
    } else if (instruction[0] == 'eq') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 == v2);
    } else if (instruction[0] == 'plus') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 + v2);
    } else if (instruction[0] == 'minus') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 - v2);
    } else if (instruction[0] == 'multiply') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 * v2);
    } else if (instruction[0] == 'divide') {
      let v2 = this.stackSafePop();
      let v1 = this.stackSafePop();
      this._stack.push(v1 / v2);
    //--------------------------------------
    // function-related instructions
    //--------------------------------------
    } else if (instruction[0] == 'function') {
      // do nothing here
    } else if (instruction[0] == 'call') {
      this.runFuncCall(instruction);
    } else if (instruction[0] == 'return' || instruction[0] == 'function_end') {
      this.runReturn(instruction);
    //--------------------------------------
    // assign instructions
    //--------------------------------------
    } else if (instruction[0] == 'assign') {
      this.runAssign(instruction);
    } else {
      throw new Error(`Unknown instruction: ${instruction}`);
    }

    this.dumpVMState();
    // there shouldn't be any code after this line
  }

  ///////////////////////////////////////////////
  // Debug
  ///////////////////////////////////////////////
  dumpInstruction(instruction) {
    if (this._debugMode) {
      console.log('command: ' + instruction.join(','));
    }
  }

  dumpVMState() {
    if (this._debugMode) {
      console.log('>>>>>>>>>>>> STACK STATE <<<<<<<<<<<<');
      console.log('stack pointer: ' + this._stackPointer);
      console.log('current stack pos: ' + (this._stack.length - 1));
      console.log('instr pointer: ' + this._instrPointer);
      console.log('content:');
      console.log(this._stack);
      console.log('>>>>>>>>>>>> STACK STATE END <<<<<<<<<<<<');
    }
  }
}

BaguetteVM.State = State;
exports.BaguetteVM = BaguetteVM;