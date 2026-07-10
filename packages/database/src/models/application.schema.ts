import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  requirementId: string;
  tutorUserId: string;
  studentUserId: string;
  introduction: string;
  proposedFee: number;
  availableTimings: string;
  freeDemo: boolean;
  message: string;
  status: 'SENT' | 'VIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    requirementId: { type: String, required: true, index: true },
    tutorUserId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true, index: true },
    introduction: { type: String, required: true },
    proposedFee: { type: Number, required: true },
    availableTimings: { type: String, required: true },
    freeDemo: { type: Boolean, default: false },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['SENT', 'VIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'SENT',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications by same tutor to the same requirement
ApplicationSchema.index({ requirementId: 1, tutorUserId: 1 }, { unique: true });

export const ApplicationModel =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
