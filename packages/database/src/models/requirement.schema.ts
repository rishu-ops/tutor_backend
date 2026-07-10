import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirement extends Document {
  studentUserId: string;
  category: string;
  curriculum?: {
    board?: string;
    level?: string;
    subject?: string;
  };
  teachingMode: string[];
  schedule: string[];
  location: {
    city: string;
    area: string;
    address?: string;
  };
  budget: {
    min: number;
    max: number;
    feeType: 'PER_HOUR' | 'PER_MONTH' | 'PER_SESSION';
  };
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'MATCHED' | 'CLOSED';
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    studentUserId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    curriculum: {
      board: { type: String },
      level: { type: String },
      subject: { type: String },
    },
    teachingMode: [{ type: String, required: true }],
    schedule: [{ type: String, required: true }],
    location: {
      city: { type: String, required: true },
      area: { type: String, required: true },
      address: { type: String },
    },
    budget: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      feeType: {
        type: String,
        enum: ['PER_HOUR', 'PER_MONTH', 'PER_SESSION'],
        required: true,
      },
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'MATCHED', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },
    applicationsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const RequirementModel =
  mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema);
