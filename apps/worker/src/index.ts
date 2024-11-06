import { createClient } from "redis";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import cluster from "cluster";
import os from "os";

const numCPUs = 3;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`Worker ${worker.process.pid} started`);
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log("Starting a new worker");
    const newWorker = cluster.fork();
    console.log(`Worker ${newWorker.process.pid} started`);
  });
} else {
  const client = createClient();
  const pubClient = createClient();

  async function processSubmission(submission: any) {
    const { code, language, roomId, submissionId, input } =
      JSON.parse(submission);
    console.log(
      `Processing submission for room id: ${roomId}, submission id: ${submissionId}`
    );

    // Create unique directory for code execution
    const absoluteCodeDir = path.resolve(`./tmp/user-${Date.now()}`);
    await fs.mkdir(absoluteCodeDir, { recursive: true });

    let codeFilePath = "";
    let dockerCommand = "";
    const inputFilePath = path.join(absoluteCodeDir, "input.txt");

    try {
      // Write input file
      await fs.writeFile(inputFilePath, input, "utf8");

      // Generate code file and Docker command based on language
      switch (language) {
        case "javascript":
          codeFilePath = path.join(absoluteCodeDir, "userCode.js");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir.replace(
            /\\/g,
            "/"
          )}:/usr/src/app" node:18 sh -c "node /usr/src/app/${path.basename(
            codeFilePath
          )} /usr/src/app/input.txt"`;
          break;

        case "python":
          codeFilePath = path.join(absoluteCodeDir, "userCode.py");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir.replace(
            /\\/g,
            "/"
          )}:/usr/src/app" python:3.9 sh -c "python /usr/src/app/${path.basename(
            codeFilePath
          )} /usr/src/app/input.txt"`;
          break;

        case "cpp":
          codeFilePath = path.join(absoluteCodeDir, "userCode.cpp");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 \
-v "${absoluteCodeDir.replace(/\\/g, "/")}:/usr/src/app" gcc:11  \
sh -c "g++ /usr/src/app/userCode.cpp -o /usr/src/app/a.out && /usr/src/app/a.out < /usr/src/app/input.txt"`;
          break;

        case "rust":
          codeFilePath = path.join(absoluteCodeDir, "userCode.rs");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir}:/usr/src/app" rust:latest sh -c "rustc /usr/src/app/userCode.rs -o /usr/src/app/a.out && /usr/src/app/a.out < /usr/src/app/input.txt"`;
          break;

        case "java":
          codeFilePath = path.join(absoluteCodeDir, "UserCode.java");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir}:/usr/src/app" openjdk:17 sh -c "javac /usr/src/app/UserCode.java && java -cp /usr/src/app UserCode < /usr/src/app/input.txt"`;
          break;

        case "go":
          codeFilePath = path.join(absoluteCodeDir, "userCode.go");
          await fs.writeFile(codeFilePath, code);
          dockerCommand = `docker run --rm --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir}:/usr/src/app" golang:1.18 sh -c "go run /usr/src/app/userCode.go < /usr/src/app/input.txt"`;
          break;

        default:
          throw new Error("Unsupported language");
      }
    } catch (error) {
      console.error("Failed to prepare code file or Docker command:", error);
      return;
    }

    // Execute Docker command
    exec(dockerCommand, async (error, stdout, stderr) => {
      let result = stdout || stderr;
      if (error) {
        result = `Error: ${error.message}`;
      }
      console.log(`Result for room ${roomId}: ${result}`);

      try {
        await pubClient.publish(roomId, result);
      } catch (err) {
        console.error("Failed to publish result to Redis:", err);
      }

      // Clean up by removing the created directory
      try {
        await fs.rm(absoluteCodeDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Failed to clean up directory:", cleanupError);
      }
    });
  }

  async function main() {
    try {
      await client.connect();
      await pubClient.connect();
      console.log("Redis Client Connected");

      while (true) {
        const submission = await client.brPop("problems", 0);
        console.log("Processing submission...");
        if (submission) {
          await processSubmission(submission.element);
        }
      }
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }

  main();
}