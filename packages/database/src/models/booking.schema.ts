import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  requirementId: string;
  studentUserId: string;
  tutorUserId: string;
  scheduledAt: Date;
  duration: number; // in minutes
  fee: number;
  type: 'DEMO' | 'REGULAR';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    requirementId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true, index: true },
    tutorUserId: { type: String, required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, default: 60, required: true },
    fee: { type: Number, default: 0, required: true },
    type: {
      type: String,
      enum: ['DEMO', 'REGULAR'],
      default: 'DEMO',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    notes: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const BookingModel =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
