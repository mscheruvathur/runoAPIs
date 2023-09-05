import env from "../constants/env";
import { MongoClient } from "mongodb";

const client = new MongoClient(env.DATABASE_URL);

const dbName = env.DATABASE_URL.split('/').pop()?.split('?').shift() ?? '';

export const COLLECTIONS = {
    ORDER: 'Order',
    Employee: 'Employee',
}

export async function connectDB() {
    await client.connect();
}

export const db = client.db(dbName);