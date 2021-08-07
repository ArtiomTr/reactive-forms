#!/usr/bin/env zx

import { $ } from 'zx';

console.log(chalk.bold('Installing dependencies'));

await $`npx lerna exec "npm install"`;

console.log(chalk.bold('Build'));

await $`npx lerna exec "npm run build"`;

console.log(chalk.bold('Lint'));

await $`npx lerna exec "npm run lint"`;

console.log(chalk.bold('Test'));

await $`npx lerna exec "npm run test"`;

console.log(chalk.green('Prepublish checks succeed!'));
