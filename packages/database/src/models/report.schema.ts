import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: string; // User ID (Postgres UUID string)
  targetType: 'USER' | 'TUTOR' | 'REQUIREMENT' | 'BOOKING' | 'CONTRACT';
  targetId: string; // ID of the user, tutor profile, requirement, booking, or contract
  reason:
    | 'FAKE_TUTOR'
    | 'FAKE_REQUIREMENT'
    | 'SPAM'
    | 'ABUSE'
    | 'SCAM'
    | 'HARASSMENT'
    | 'NO_SHOW'
    | 'SERVICE_NOT_DELIVERED'
    | 'PAYMENT_DISPUTE'
    | 'OTHER';
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  resolution?: string;
  resolvedById?: string; // Admin User ID (Postgres UUID string)
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['USER', 'TUTOR', 'REQUIREMENT', 'BOOKING', 'CONTRACT'],
      required: true,
    },
    targetId: { type: String, required: true },
    reason: {
      type: String,
      enum: [
        'FAKE_TUTOR',
        'FAKE_REQUIREMENT',
        'SPAM',
        'ABUSE',
        'SCAM',
        'HARASSMENT',
        'NO_SHOW',
        'SERVICE_NOT_DELIVERED',
        'PAYMENT_DISPUTE',
        'OTHER',
      ],
      required: true,
    },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED', 'IGNORED'],
      default: 'PENDING',
      required: true,
    },
    resolution: { type: String },
    resolvedById: { type: String },
  },
  { timestamps: true }
);

export const ReportModel =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
