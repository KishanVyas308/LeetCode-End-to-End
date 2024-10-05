import { createClient } from 'redis';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const client = createClient();
const pubClient = createClient();

async function processSubmission(submission) {
  const { code, language, userId, submissionId } = JSON.parse(submission);
  console.log(`Processing submission ${submissionId}`);

  const codeDir = path.resolve(`./tmp/user-${Date.now()}`);
  fs.mkdirSync(codeDir, { recursive: true });

  const fileExtension = language === 'python' ? 'py' : 'js';
  const codeFilePath = path.join(codeDir, `userCode.${fileExtension}`);

  fs.writeFileSync(codeFilePath, code);

  const dockerCommand = language === 'python'
    ? `docker run --rm -v "${codeDir.replace(/\\/g, '/') }:/usr/src/app" python:3.9 python /usr/src/app/userCode.py`
    : `docker run --rm -v "${codeDir.replace(/\\/g, '/') }:/usr/src/app" node node /usr/src/app/userCode.js`;

  exec(dockerCommand, async (error, stdout, stderr) => {
    let result = stdout || stderr;
    if (error) {
      result = `Error: ${error.message}`;
    }

    await pubClient.publish(submissionId, result);
    fs.rmSync(codeDir, { recursive: true, force: true });
  });
}

async function main() {
  try {
    await client.connect();
    await pubClient.connect();
    console.log("Redis Client Connected");

    while (true) {
      const submission = await client.brPop('problems', 0);
      console.log("Processing submission...");
      await processSubmission(submission.element);
    }
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
