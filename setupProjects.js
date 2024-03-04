import { execSync } from 'child_process';
import path from 'path';

// Function to run setup commands in a given directory
function setupProject(fullPath) {
  console.log(`Setting up project in: ${fullPath}`);

  // Run npm install
  console.log('Running npm install...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: fullPath });
  } catch (error) {
    console.error(`Failed to run npm install in ${fullPath}`, error);
  }

  // Run tsc
  console.log('Compiling TypeScript...');
  try {
    execSync('tsc', { stdio: 'inherit', cwd: fullPath });
  } catch (error) {
    console.error(`Failed to compile TypeScript in ${fullPath}`, error);
  }
}

// List of project directories one level below this script's location
const projectDirs = [
  'Artifex',
  'Bumbles',
  'Tamar',
  'Yosef',
  // Add more project directories as needed
];

// Setup the root project first
const rootPath = path.resolve(path.dirname(''));
setupProject(rootPath);

// Then, setup each specified project directory
projectDirs.forEach((dir) => {
  const fullPath = path.resolve(rootPath, dir);
  setupProject(fullPath);
});

console.log('All projects set up!');
