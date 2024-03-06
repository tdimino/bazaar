import { spawn } from 'child_process';
import { join } from 'path';

// Updated paths to the bot files for Bumbles, Artifex, and Ceres to reflect their build directories
// const bumblesPath = join('.', 'dist', 'bumbles', 'discord', 'index.js');
const tamarPath = join('.', 'Tamar', 'dist', 'discord', 'index.js');
const artifexPath = join('.', 'Artifex', 'dist', 'discord', 'index.js');
const yosefPath = join('.', 'Yosef', 'dist', 'discord', 'index.js');

// Function to launch bots
const launchBot = (botPath) => {
  const botProcess = spawn('node', [botPath], { shell: true });

  botProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data.toString()}`);
  });

  botProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data.toString()}`);
  });

  botProcess.on('error', (err) => {
    console.error(`Failed to start bot process: ${err.message}`);
  });

  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
  });
};

// Launch bots with node
// launchBot(bumblesPath);
launchBot(tamarPath);
launchBot(artifexPath);
launchBot(yosefPath);

