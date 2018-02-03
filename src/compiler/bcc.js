#!/usr/bin/env node
const fs = require('fs');
const BaguetteCompiler = require('./baguette-compiler').BaguetteCompiler;

const args = require('minimist')(process.argv.slice(2));

if (args['_'].length == 0) {
  console.log('Usage: node bcc.js input-pik-source-filename [-o output-pbj-intermediate-code-filename]');
  process.exit(0);
}

let filename = args['_'][0];
let content = fs.readFileSync(filename, 'utf8');

let pc = new BaguetteCompiler(content);
let interCode = pc.generateIntermediateCode();
if ('o' in args) {
  fs.writeFileSync(args['o'], interCode, {encoding: 'utf8'});
  console.log(`Intermediate Code generation succeed, output_file=${args['o']}`);
} else {
  console.log(interCode);
}

