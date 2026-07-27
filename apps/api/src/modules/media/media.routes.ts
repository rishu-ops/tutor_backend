import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();
const controller = new MediaController();

// 1. Setup Multer for images
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// 2. Setup Multer for documents (PDF & Images)
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files and images are allowed for certificates'));
    }
  },
});

// 3. Setup Multer for videos
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for introduction'));
    }
  },
});

// Route mappings
router.post('/upload', requireAuth, uploadImage.single('image'), controller.uploadImage.bind(controller));
router.post('/upload-document', requireAuth, uploadDocument.single('document'), controller.uploadDocument.bind(controller));
router.post('/upload-video', requireAuth, uploadVideo.single('video'), controller.uploadVideo.bind(controller));

export default router;
export { router as mediaRouter };
