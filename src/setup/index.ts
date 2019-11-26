#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import c from 'ansi-colors';
import Handlebars from 'handlebars';
import stripJsonComments from 'strip-json-comments';
const { prompt } = require('enquirer');
const cwd = process.cwd();

(async function () {
  console.log(`${c.green('✔')} Creating a new secret file...`);
  const secretExampleFileLoc = path.join(cwd, '.secret_config-example.json');
  const secretDestinationFileLoc = path.join(cwd, '.secret_config.json');
  const secretFileTemplate = fs.readFileSync(secretExampleFileLoc, {encoding: 'utf8'});
  fs.copyFileSync(secretExampleFileLoc, secretDestinationFileLoc);

  // Use `process.stdout.write` instead of `console.log` because we don't want a newline added
  process.stdout.write(`${c.green('✔')} Generating a new random API key... `);
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  process.stdout.write(c.dim(randomString) + '\n');

  const {serverUrl, accountAddress, accountSecret} = await prompt([{
      type: 'input',
      name: 'serverUrl',
      message: 'Network Server Address',
      initial: 'wss://s.altnet.rippletest.net:51233 (Testnet)',
      result: (val: string) => val.trim().split(' ').shift(),
      validate: (val: string) => val.trim().split(' ').shift()!.length > 0,
    },
    {
      type: 'input',
      name: 'accountAddress',
      message: 'Account Public Address',
      result: (val: string) => val.trim(),
      validate: (val: string) => val.trim().length > 0
    },
    {
      type: 'input',
      name: 'accountSecret',
      message: 'Account Private Key',
      result: (val: string) => val.trim(),
      validate: (val: string) => val.trim().length > 0
    }
  ]);

  const secretTemplate = Handlebars.compile(secretFileTemplate);
  const secretTemplated = secretTemplate({SERVER_ADDRESS_HERE: serverUrl, ACCOUNT_ADDRESS_HERE: accountAddress, RANDOM_STRING_HERE: randomString, ACCOUNT_SECRET_HERE: accountSecret});
  fs.writeFileSync(secretDestinationFileLoc, stripJsonComments(secretTemplated), {encoding: 'utf8'});
  console.log('✅ Setup complete! Start the server in dev mode: ' + c.bold('yarn dev'));
})();