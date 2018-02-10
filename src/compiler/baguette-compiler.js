var fs = require('fs');
var nearley = require('nearley');
var baguetteGrammar = require('./baguette-grammar');

class BaguetteCompiler {
  constructor(content) {
    this.content = content;
    this.intermediateCode = '';
    this.parseTree = [];
    this.curStatement = [];
    this.nextFlowTag = 0;
  }

  getNextFlowTag() {
    return "flowtag." + (this.nextFlowTag++);
  }

  generateParseTree() {
    var parser = new nearley.Parser(baguetteGrammar.ParserRules, baguetteGrammar.ParserStart)
    parser.feed(this.content);
    if (!parser.results[0]) {
      throw new Error();
    }
    this.parseTree = parser.results;

    return parser.results;
  }

  addInstruction(instructionArray) {
     let instruction = instructionArray.join(',') + '\n';
    this.intermediateCode += instruction;
  }

  isBool(n) {
    return n == "true" || n == "false";
  }

  isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  isSymbol(id) {
    let varPattern = /^[a-zA-Z][a-zA-Z0-9.]*/;
    return varPattern.test(id);
  }

  isString(id) {
    let varPattern = /^".*"/;
    return varPattern.test(id);
  }

  generateIntermediateCode() {
    this.generateParseTree();

    let funcDecls = this.parseTree[0];
    for (let i = 0; i < funcDecls.length; i++) {
      let funcDecl = funcDecls[i];
      if (funcDecl[0] != 'func') {
        throw new Error("not a function");
      }

      this.addInstruction(['function', funcDecl[1]]);
      this.generateBlock(funcDecl[3]);
      this.addInstruction(['function_end']);
    }

    return this.intermediateCode;
  }

  generateParams(params) {
    for (let i = 0; i < params.length; i++) {
      let param = params[i];
      this.generateExp(param);
    }
  }

  generateFunctionCall(statement) {
    if (!this.isSymbol(statement[1])) {
      throw new Error(`Function name is not a symbol, line=${this.curStatement}`);
    }
    this.generateParams(statement[2]);
    this.addInstruction(['call', statement[1]]);
  }

  generateAssign(statement) {
    this.generateExp(statement[3]);
    if (!this.isSymbol(statement[1])) {
      throw new Error(`${this.curStatement[1]} is not a variable!`);
    }

    this.addInstruction(['assign', statement[1]]);
  }

  generateIfWithoutIfEndTag(statement) {
    this.generateExp(statement[1]);

    let ifNotEndTag = this.getNextFlowTag();
    this.addInstruction(["if_not_goto", ifNotEndTag]);
    this.generateBlock(statement[2]);

    let ifEndTag = this.getNextFlowTag();
    this.addInstruction(["goto", ifEndTag]);

    this.addInstruction(["tag", ifNotEndTag]);

    return ifEndTag;
  }

  generateIf(statement) {
    let ifEndTag = this.generateIfWithoutIfEndTag(statement);
    this.addInstruction(["tag", ifEndTag]);
  }

  generateIfElse(statement) {
    let ifEndTag = this.generateIfWithoutIfEndTag(statement[1]);
    this.generateBlock(statement[2]);
    this.addInstruction(["tag", ifEndTag]);
  }

  generateBlock(statements) {
    for (let i = 0; i < statements.length; i++) {
      this.curStatement = statements[i];
      let statement = statements[i];

      if (Array.isArray(statement[0])) {
        // For some reason (bug?), nearley SOMETIMES added a nested array for "if" statement
        // workaround for now
        this.generateBlock(statement);
      } else if (statement[0] == 'ifElse') {
        this.generateIfElse(statement);
      } else if (statement[0] == 'if') {
        this.generateIf(statement);
      } else if (statement[0] == 'return') {
        this.generateExp(statement[1]);
        this.addInstruction(['return']);
      } else if (statement[0] == 'assignment') {
        this.generateAssign(statement);
      } else if (statement[0] == 'call') {
        this.generateFunctionCall(statement);
      } else {
        throw new Error(`Unknown statement ${this.curStatement}`);
      }
    }
  }

  generateExp(exp) {
    if (exp[0] == 'call') {
      this.generateFunctionCall(exp);
    } else if (this.isBool(exp)) {
      this.addInstruction(['pushbool', exp]);
    } else if (this.isNumeric(exp)) {
      this.addInstruction(['pushnum', exp]);
    } else if (this.isString(exp)) {
      this.addInstruction(['pushstr', exp.replace(/"/g, '')]);
    } else if (this.isSymbol(exp)) {
      this.addInstruction(['pushvar', exp]);
    } else if (exp[0] == '!') {
      this.generateExp(exp[1]);
      this.addInstruction(['logic_not']);
    } else if (exp[0] == '&&') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['logic_and']);
    } else if (exp[0] == '||') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['logic_or']);
    } else if (exp[0] == '>') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['more']);
    } else if (exp[0] == '>=') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['more_or_eq']);
    } else if (exp[0] == '<') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['less']);
    } else if (exp[0] == '<=') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['less_or_eq']);
    } else if (exp[0] == '==') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['eq']);
    } else if (exp[0] == '+') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['plus']);
    } else if (exp[0] == '-') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['minus']);
    } else if (exp[0] == '*') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['multiply']);
    } else if (exp[0] == '/') {
      this.generateExp(exp[1]);
      this.generateExp(exp[2]);
      this.addInstruction(['divide']);
    }
  }
}

exports.BaguetteCompiler = BaguetteCompiler;