import Redis from "ioredis";

// Connect to redis
const client = new Redis();
export const bookClient = new Redis();
console.log("Redis is running...");

export default client;
