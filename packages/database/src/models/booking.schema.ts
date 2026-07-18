import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  requirementId: string;
  studentUserId: string;
  tutorUserId: string;
  scheduledAt: Date;
  duration: number; // minutes
  sessionMode: 'ONLINE' | 'ONSITE' | 'HYBRID';
  isFirstSession: boolean; // true = trial/demo, false = regular
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  meetingLink?: string; // ONLINE only
  location?: string; // ONSITE only — tutor area / address note
  declineReason?: string; // tutor fills when declining
  rescheduledFrom?: Date; // original time before reschedule
  rescheduleRequestedBy?: string; // userId who proposed new time
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
    sessionMode: {
      type: String,
      enum: ['ONLINE', 'ONSITE', 'HYBRID'],
      default: 'ONLINE',
      required: true,
    },
    isFirstSession: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    notes: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },
    declineReason: { type: String, default: '' },
    rescheduledFrom: { type: Date },
    rescheduleRequestedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ studentUserId: 1, tutorUserId: 1, isFirstSession: 1 });

export const BookingModel =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
