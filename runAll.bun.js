import { exec } from "child_process";

const runCommand = (command, path) => {
  const process = exec(command, { cwd: path });

  process.stdout.on("data", (data) => {
    console.log(data);
  });

  process.stderr.on("data", (data) => {
    console.error(data);
  });

  process.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

// Commands to run each project, with their respective paths
const projects = [
  { command: "bun run start", path: "yosef" },
  { command: "bun run start", path: "tamar" },
  { command: "bun run start", path: "artifex" }
];

projects.forEach(({ command, path }) => runCommand(command, path));
