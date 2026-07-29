/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { redis } from 'database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Cloudinary if credentials are provided
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}


export class MediaController {
  // 1. Upload Profile Image / General Image
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No image file uploaded' });
        return;
      }

      let imageUrl = '';

      if (isCloudinaryConfigured) {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'project-tutor/avatars',
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(req.file?.buffer);
        });

        imageUrl = result.secure_url;
      } else {
        const uploadsDir = path.resolve(__dirname, '../../../uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, req.file.buffer);

        const port = process.env.PORT || 3000;
        const host = req.get('host') || `localhost:${port}`;
        const protocol = req.protocol || 'http';
        imageUrl = `${protocol}://${host}/uploads/${filename}`;
      }

      res.status(200).json({
        success: true,
        url: imageUrl,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Image upload failed',
      });
    }
  }

  // 2. Upload Document (PDF/Images for qualifications)
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No document file uploaded' });
        return;
      }

      let fileUrl = '';

      if (isCloudinaryConfigured) {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'project-tutor/documents',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(req.file?.buffer);
        });

        fileUrl = result.secure_url;
      } else {
        const uploadsDir = path.resolve(__dirname, '../../../uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || '.pdf';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, req.file.buffer);

        const port = process.env.PORT || 3000;
        const host = req.get('host') || `localhost:${port}`;
        const protocol = req.protocol || 'http';
        fileUrl = `${protocol}://${host}/uploads/${filename}`;
      }

      res.status(200).json({
        success: true,
        url: fileUrl,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Document upload failed',
      });
    }
  }

  // 3. Upload Intro Video (MP4/WebM)
  async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No video file uploaded' });
        return;
      }

      let fileUrl = '';

      if (isCloudinaryConfigured) {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'project-tutor/videos',
              resource_type: 'video',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(req.file?.buffer);
        });

        fileUrl = result.secure_url;
      } else {
        const uploadsDir = path.resolve(__dirname, '../../../uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || '.mp4';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, req.file.buffer);

        const port = process.env.PORT || 3000;
        const host = req.get('host') || `localhost:${port}`;
        const protocol = req.protocol || 'http';
        fileUrl = `${protocol}://${host}/uploads/${filename}`;
      }

      res.status(200).json({
        success: true,
        url: fileUrl,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Video upload failed',
      });
    }
  }

  // 4. Upload a file in a chat conversation (images, PDF, doc, xls)
  // Enforces: max 5 MB per file, max 5 files per user per day
  async uploadChatFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // ── Per-user daily quota: 5 files per day ────────────────────────────
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const redisKey = `chat_uploads:${userId}:${today}`;
      const DAILY_LIMIT = 5;

      try {
        const current = await redis.get(redisKey);
        const count = current ? parseInt(current, 10) : 0;
        if (count >= DAILY_LIMIT) {
          res.status(429).json({
            success: false,
            error: `Daily file limit reached. You can share up to ${DAILY_LIMIT} files per day.`,
          });
          return;
        }
        await redis.incr(redisKey);
        await redis.expire(redisKey, 25 * 60 * 60);
      } catch {
        // Redis unavailable — allow upload, don't break the feature
      }

      let fileUrl = '';
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;

      if (isCloudinaryConfigured) {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'project-tutor/chat-files',
              resource_type: 'auto',
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(req.file?.buffer);
        });
        fileUrl = result.secure_url;
      } else {
        const uploadsDir = path.resolve(__dirname, '../../../uploads/chat');
        await fs.mkdir(uploadsDir, { recursive: true });
        const ext = path.extname(originalName) || '';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        await fs.writeFile(path.join(uploadsDir, filename), req.file.buffer);
        const port = process.env.PORT || 3000;
        const host = req.get('host') || `localhost:${port}`;
        fileUrl = `${req.protocol}://${host}/uploads/chat/${filename}`;
      }

      res.status(200).json({
        success: true,
        url: fileUrl,
        name: originalName,
        type: mimeType,
        size,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'File upload failed',
      });
    }
  }
}
