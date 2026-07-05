import { z } from 'zod';

export const updateTutorProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  bio: z.string().min(50, 'Bio must be at least 50 characters long').optional(),
  subjects: z
    .array(
      z.object({
        subject: z.string().min(1, 'Subject cannot be empty'),
        level: z.string().min(1, 'Level cannot be empty'),
        experienceYears: z.number().min(0, 'Experience years must be positive'),
      })
    )
    .min(1, 'At least one subject is required')
    .optional(),
  qualifications: z
    .array(
      z.object({
        degree: z.string().min(1, 'Degree cannot be empty'),
        institution: z.string().min(1, 'Institution cannot be empty'),
        year: z.number().min(1900, 'Invalid year'),
      })
    )
    .optional(),
  teachingModes: z.array(z.string().min(1)).min(1).optional(),
  languages: z.array(z.string().min(1)).min(1).optional(),
  pricing: z
    .object({
      min: z.number().positive('Min price must be positive'),
      max: z.number().positive('Max price must be positive'),
    })
    .optional(),
  location: z
    .object({
      city: z.string().min(1, 'City cannot be empty'),
      area: z.string().min(1, 'Area cannot be empty'),
    })
    .optional(),
  availability: z.array(z.string()).optional(),
});

export type UpdateTutorProfileInput = z.infer<typeof updateTutorProfileSchema>;
