import { randomUUID } from 'crypto';
import fs from 'fs';
import { Router } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { HttpError } from '../lib/http-error';
import {
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  hasImageSignature,
  UPLOADS_DIR,
  UPLOADS_ROUTE,
} from '../lib/uploads';

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    // The client file name is never used: the extension comes from the
    // checked content type, and the name is random.
    filename: (_req, file, done) => {
      done(null, `${randomUUID()}${IMAGE_EXTENSIONS[file.mimetype]}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, done) => {
    if (IMAGE_EXTENSIONS[file.mimetype]) {
      done(null, true);
    } else {
      done(new HttpError(400, 'Only JPEG, PNG or WebP images can be uploaded'));
    }
  },
});

export const uploadRouter = Router();

/**
 * POST /uploads/images  (multipart form, field name "image")
 *
 * Owners only, since only owners manage restaurants and meals. Returns the
 * path to store on a restaurant or meal.
 */
uploadRouter.post(
  '/images',
  authenticate,
  authorize(Role.RESTAURANT_OWNER),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Images must be 5 MB or smaller'
            : 'Upload one image in a field named "image"';
        return next(new HttpError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, message));
      }
      if (err) return next(err);
      if (!req.file) {
        return next(new HttpError(400, 'Upload one image in a field named "image"'));
      }
      if (!hasImageSignature(req.file.path, req.file.mimetype)) {
        fs.rmSync(req.file.path, { force: true });
        return next(new HttpError(400, 'That file is not a valid image'));
      }
      res.status(201).json({ imageUrl: `${UPLOADS_ROUTE}/${req.file.filename}` });
    });
  }
);
