import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { logger } from "./logger.js";
let client = null;
export async function getMongoDb() {
    if (!client) {
        client = new MongoClient(env.MONGODB_URI);
        await client.connect();
        logger.info({ dbName: env.MONGODB_DB_NAME }, "connected to mongodb");
    }
    return client.db(env.MONGODB_DB_NAME);
}
