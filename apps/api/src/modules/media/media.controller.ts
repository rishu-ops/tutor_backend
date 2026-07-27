/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

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
}
