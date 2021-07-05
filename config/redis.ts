import Redis from "ioredis";

// Connect to redis
const client = new Redis();
console.log("Redis is running...");

export default client;
