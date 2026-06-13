import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import {
  UpdateClinicSchema,
  UpdateAISettingsSchema,
  UpdateWorkingHoursSchema,
  UpdateTreatmentsSchema,
} from '../schemas/settings.schemas';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/settings
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: {
      id: true, name: true, ownerName: true, email: true, phone: true,
      specialty: true, address: true, logoUrl: true, timezone: true,
      bookingSlug: true, workingHours: true, treatments: true, defaultFee: true,
      aiEnabled: true, aiLanguage: true, aiPersonality: true, autoConfirm: true,
      reminderTiming: true, reviewTiming: true, customIntroMsg: true,
      googlePlaceId: true, onboardingDone: true,
    },
  });
  if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');
  res.json(clinic);
});

// PATCH /api/settings/clinic
export const updateClinicInfo = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateClinicSchema.parse(req.body);
  const clinicId = req.clinicId!;

  if (data.bookingSlug) {
    const existing = await prisma.clinic.findFirst({
      where: { bookingSlug: data.bookingSlug, NOT: { id: clinicId } },
    });
    if (existing) throw createError('This booking URL is already taken', 409, 'SLUG_TAKEN');
  }

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data,
  });

  res.json(clinic);
});

// PATCH /api/settings/ai
export const updateAISettings = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateAISettingsSchema.parse(req.body);
  const clinic = await prisma.clinic.update({
    where: { id: req.clinicId! },
    data,
  });
  res.json(clinic);
});

// PATCH /api/settings/hours
export const updateWorkingHours = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateWorkingHoursSchema.parse(req.body);
  const clinic = await prisma.clinic.update({
    where: { id: req.clinicId! },
    data: { workingHours: data.workingHours },
  });
  res.json(clinic);
});

// PATCH /api/settings/treatments
export const updateTreatments = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateTreatmentsSchema.parse(req.body);
  const clinic = await prisma.clinic.update({
    where: { id: req.clinicId! },
    data: { treatments: data.treatments, onboardingDone: true },
  });
  res.json(clinic);
});

// POST /api/settings/logo
export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw createError('No file uploaded', 400, 'NO_FILE');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw createError('Only JPEG, PNG, WebP, or SVG files are allowed', 400, 'INVALID_FILE_TYPE');
  }

  if (req.file.size > 5 * 1024 * 1024) {
    throw createError('File size must be under 5MB', 400, 'FILE_TOO_LARGE');
  }

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'medicore/logos',
        public_id: `clinic-${req.clinicId}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
      },
      (err, result) => {
        if (err || !result) reject(err);
        else resolve(result as { secure_url: string });
      }
    );
    uploadStream.end(req.file!.buffer);
  });

  await prisma.clinic.update({
    where: { id: req.clinicId! },
    data: { logoUrl: result.secure_url },
  });

  res.json({ logoUrl: result.secure_url });
});

// Multer middleware for logo upload (in-memory)
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('logo');
