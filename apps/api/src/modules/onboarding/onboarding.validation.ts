import { z } from 'zod';

export const onboardingStudentSchema = z.object({
  role: z.literal('STUDENT'),
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  school: z.string().min(1, 'School is required'),
  class: z.string().min(1, 'Class is required'),
  preferredLanguage: z.string().min(1, 'Preferred language is required'),
  learningMode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
});

export const onboardingTutorSchema = z.object({
  role: z.literal('TUTOR'),
  name: z.string().min(1, 'Name is required'),
  bio: z.string().min(50, 'Bio must be at least 50 characters long'),
  subjects: z
    .array(
      z.object({
        subject: z.string().min(1, 'Subject is required'),
        level: z.string().min(1, 'Level is required'),
        experienceYears: z.number().min(0, 'Experience years must be positive'),
      })
    )
    .min(1, 'At least one subject is required'),
  languages: z.array(z.string().min(1)).min(1, 'At least one language is required'),
  teachingModes: z.array(z.string().min(1)).min(1, 'At least one teaching mode is required'),
  pricing: z.object({
    min: z.number().positive('Min price must be positive'),
    max: z.number().positive('Max price must be positive'),
  }),
  location: z.object({
    city: z.string().min(1, 'City is required'),
    area: z.string().min(1, 'Area is required'),
  }),
  qualifications: z
    .array(
      z.object({
        degree: z.string().min(1, 'Degree is required'),
        institution: z.string().min(1, 'Institution is required'),
        year: z.coerce.number().int().positive('Year must be a positive integer'),
      })
    )
    .optional(),
  availability: z.array(z.string()).optional(),
});

// Discriminated union for routing and validation
export const onboardingSchema = z.discriminatedUnion('role', [
  onboardingStudentSchema,
  onboardingTutorSchema,
]);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingStudentInput = z.infer<typeof onboardingStudentSchema>;
export type OnboardingTutorInput = z.infer<typeof onboardingTutorSchema>;
