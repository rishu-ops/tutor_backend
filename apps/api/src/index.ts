import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { logger } from 'logger';
import { connectPostgres, connectMongoDB, connectRedis } from 'database';
import { authRouter } from './modules/auth/index.js';
import { onboardingRouter } from './modules/onboarding/index.js';
import { studentRouter } from './modules/student/index.js';
import { tutorRouter } from './modules/tutor/index.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS - allow frontend to access API
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);

app.use(express.json());

// Swagger Configuration
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Tutor API',
      version: '1.0.0',
      description: 'API Documentation for Project Tutor backend services',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development Server',
      },
    ],
  },
  apis: ['./src/index.ts', './src/**/*.ts', './apps/api/src/index.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the API server.
 *     responses:
 *       200:
 *         description: Server is healthy and running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
app.use('/api/auth', authRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/student', studentRouter);
app.use('/api/v1/tutor', tutorRouter);

app.get('/health', (req, res) => {
  res.json({ success: true });
});

async function startServer() {
  try {
    logger.info('Connecting to databases...');

    // Connect to PostgreSQL via Prisma
    if (process.env.DATABASE_URL) {
      await connectPostgres();
      logger.info('Connected to PostgreSQL database successfully.');
    } else {
      logger.warn('DATABASE_URL is not defined in environment variables.');
    }

    // Connect to MongoDB via Mongoose
    if (process.env.MONGODB_URI) {
      await connectMongoDB(process.env.MONGODB_URI);
      logger.info('Connected to MongoDB successfully.');
    } else {
      logger.warn('MONGODB_URI is not defined in environment variables.');
    }

    // Connect to Redis via ioredis
    if (process.env.REDIS_URL) {
      connectRedis(process.env.REDIS_URL);
      logger.info('Connected to Redis successfully.');
    } else {
      logger.warn('REDIS_URL is not defined in environment variables.');
    }

    // Start Express application
    app.listen(port, () => {
      logger.info(`Server is running at http://localhost:${port}`);
      logger.info(`API documentation available at http://localhost:${port}/api/docs`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
