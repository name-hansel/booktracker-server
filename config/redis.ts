import redis from "redis";

// Connect to redis
const client = redis.createClient();
client.on("connect", function () {
  console.log("Connected to Redis...");
});

export default client;
