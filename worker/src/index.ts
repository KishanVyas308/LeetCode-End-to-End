import { createClient } from 'redis'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { stdout } from 'process';

const client = createClient();
const pubClient = createClient();

async function processSubmission(submission : any) {
    const { problemId, code, language, userId, submissionId } = JSON.parse(submission);
  console.log(`Processing submission ${submissionId} for problem ${problemId}`);

  const absoluteCodeDir = path.resolve(`./tmp/user-${Date.now()}`);
  fs.mkdirSync(absoluteCodeDir, { recursive: true });

  const codeFilePath = path.join(absoluteCodeDir, 'userCode.js'); // Adjust based on the language
  fs.writeFileSync(codeFilePath, code);

  const dockerCommand = `docker run --rm -v "${absoluteCodeDir.replace(/\\/g, '/') }:/usr/src/app" user-code-runner node /usr/src/app/userCode.js`;

    exec(dockerCommand, async(error, stdout, stderr) => {
        let result = stdout || stderr;
        if(error) {
            result = `Error: ${error.message}`;
        }

        await pubClient.publish(submissionId, result);

        fs.rmSync(absoluteCodeDir, { recursive: true, force: true });
    })

}

async function main() {
    try {
      await client.connect();
      await pubClient.connect();
      console.log('Redis Client Connected');
      while (true) {
        const submission : any = await client.brPop('problems', 0);
        console.log("Worker processing submission...");
        await processSubmission(submission.element);
      }
    } catch (error) {
      console.log("Failed to connect to Redis", error);
    }
  }
  
  main();

