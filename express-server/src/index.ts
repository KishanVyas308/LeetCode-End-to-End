import express from "express";
import { createClient } from "redis";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

app.post("/submit", async (req, res) => {
  const { code, language, userId, input } = req.body;
  const submissionId = `submission-${Date.now()}-${userId}`;

  console.log(`Received submission from user ${userId}`);

  try {
    // Push submission to Redis
    await redisClient.lPush(
      "problems",
      JSON.stringify({ code, language, userId, submissionId, input })
    );

    console.log(
      `Submission pushed to Redis for: ${userId}  and problem id: ${submissionId}`
    );

    res.status(200).send("Submission received and stored");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to store submission");
  }
});

const server = app.listen(3000, () => {
  console.log("Express Server Listening on port 3000");
});

async function main() {
  try {
    await redisClient.connect();

    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
