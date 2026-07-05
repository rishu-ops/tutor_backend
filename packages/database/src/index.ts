import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Redis Client
export let redis: Redis;

export function connectRedis(url: string): Redis {
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
    });
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
}

// Connect to PostgreSQL (Prisma)
export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to PostgreSQL (Prisma):', error);
    throw error;
  }
}

// Connect to MongoDB (Mongoose)
export async function connectMongoDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    console.error('Failed to connect to MongoDB (Mongoose):', error);
    throw error;
  }
}

// Disconnect helper for testing or graceful shutdown
export async function disconnectDatabases(): Promise<void> {
  await prisma.$disconnect();
  await mongoose.disconnect();
  if (redis) {
    await redis.quit();
  }
}

export * from './models/student-profile.schema.js';
export * from './models/tutor-profile.schema.js';
