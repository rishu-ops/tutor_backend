import { z } from 'zod';

export const createRequirementSchema = z
  .object({
    category: z.string().min(1, 'Category is required'),
    curriculum: z
      .object({
        board: z.string().optional(),
        level: z.string().optional(),
        subject: z.string().optional(),
      })
      .optional(),
    teachingMode: z.array(z.string()).min(1, 'Select at least one teaching mode'),
    schedule: z.array(z.string()).min(1, 'Select at least one preferred schedule option'),
    location: z.object({
      city: z.string().min(1, 'City is required'),
      area: z.string().min(1, 'Area is required'),
      address: z.string().optional(),
    }),
    budget: z.object({
      min: z.number().positive('Minimum budget must be positive'),
      max: z.number().positive('Maximum budget must be positive'),
      feeType: z.enum(['PER_HOUR', 'PER_MONTH', 'PER_SESSION']),
    }),
    description: z.string().min(20, 'Description must be at least 20 characters long'),
  })
  .refine((data) => data.budget.min <= data.budget.max, {
    message: 'Minimum budget cannot be greater than maximum budget',
    path: ['budget', 'min'],
  })
  .refine(
    (data) => {
      if (data.category === 'School Education') {
        return (
          data.curriculum &&
          data.curriculum.board &&
          data.curriculum.board.trim().length > 0 &&
          data.curriculum.level &&
          data.curriculum.level.trim().length > 0 &&
          data.curriculum.subject &&
          data.curriculum.subject.trim().length > 0
        );
      }
      return true;
    },
    {
      message: 'Board, Class, and Subject are required for School Education category',
      path: ['curriculum'],
    }
  );

export const updateRequirementSchema = z
  .object({
    category: z.string().min(1, 'Category is required').optional(),
    curriculum: z
      .object({
        board: z.string().optional(),
        level: z.string().optional(),
        subject: z.string().optional(),
      })
      .optional(),
    teachingMode: z.array(z.string()).min(1, 'Select at least one teaching mode').optional(),
    schedule: z.array(z.string()).min(1, 'Select at least one schedule option').optional(),
    location: z
      .object({
        city: z.string().min(1, 'City is required'),
        area: z.string().min(1, 'Area is required'),
        address: z.string().optional(),
      })
      .optional(),
    budget: z
      .object({
        min: z.number().positive('Minimum budget must be positive'),
        max: z.number().positive('Maximum budget must be positive'),
        feeType: z.enum(['PER_HOUR', 'PER_MONTH', 'PER_SESSION']),
      })
      .optional(),
    description: z.string().min(20, 'Description must be at least 20 characters long').optional(),
  })
  .refine(
    (data) => {
      if (data.budget) {
        return data.budget.min <= data.budget.max;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot be greater than maximum budget',
      path: ['budget', 'min'],
    }
  )
  .refine(
    (data) => {
      if (data.category === 'School Education') {
        return (
          data.curriculum &&
          data.curriculum.board &&
          data.curriculum.board.trim().length > 0 &&
          data.curriculum.level &&
          data.curriculum.level.trim().length > 0 &&
          data.curriculum.subject &&
          data.curriculum.subject.trim().length > 0
        );
      }
      return true;
    },
    {
      message: 'Board, Class, and Subject are required for School Education category',
      path: ['curriculum'],
    }
  );

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
