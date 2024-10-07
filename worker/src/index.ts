import { createClient } from 'redis';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const client = createClient();
const pubClient = createClient();

async function processSubmission(submission : any) {
  const { code, language, userId, submissionId } = JSON.parse(submission);
  console.log(`Processing submission for user id : ${userId} and submission id: ${submissionId}`);

  const absoluteCodeDir = path.resolve(`./tmp/user-${Date.now()}`);
  fs.mkdirSync(absoluteCodeDir, { recursive: true });

  let codeFilePath = '';
  let dockerCommand = '';
console.log(language);

  switch (language) {
      case 'javascript':
        codeFilePath = path.join(absoluteCodeDir, 'userCode.js');
        fs.writeFileSync(codeFilePath, code);
        dockerCommand = `docker run --rm --network none --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir.replace(/\\/g, '/') }:/usr/src/app" user-code-runner node /usr/src/app/${path.basename(codeFilePath)}`;
        break;

    case 'python':
        codeFilePath = path.join(absoluteCodeDir, 'userCode.py');
        fs.writeFileSync(codeFilePath, code);
        dockerCommand = `docker run --rm --network none --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir.replace(/\\/g, '/') }:/usr/src/app" user-code-runner python3 /usr/src/app/${path.basename(codeFilePath)}`;
        break;

    case 'cpp':
        codeFilePath = path.join(absoluteCodeDir, 'userCode.cpp');
        fs.writeFileSync(codeFilePath, code);
        dockerCommand = `docker run --rm --network none --memory="256m" --cpus="1.0" --pids-limit 100 -v "${absoluteCodeDir.replace(/\\/g, '/') }:/usr/src/app" user-code-runner sh -c "g++ /usr/src/app/${path.basename(codeFilePath)} -o /usr/src/app/a.out && /usr/src/app/a.out"`;
        break;
  
    default:
      throw new Error('Unsupported language');
     
  }



  exec(dockerCommand, async (error, stdout, stderr) => {
    let result = stdout || stderr;
    if (error) {
      result = `Error: ${error.message}`;
    }
    console.log(`Result: ${result}`);
    
    await pubClient.publish(userId, result);
    fs.rmSync(absoluteCodeDir, { recursive: true, force: true });
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
      await processSubmission(submission?.element);
    }
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
