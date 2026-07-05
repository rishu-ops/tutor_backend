import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  city: z.string().min(1, 'City cannot be empty').optional(),
  school: z.string().min(1, 'School cannot be empty').optional(),
  class: z.string().min(1, 'Class cannot be empty').optional(),
  preferredLanguage: z.string().min(1, 'Preferred language cannot be empty').optional(),
  learningMode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional(),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
