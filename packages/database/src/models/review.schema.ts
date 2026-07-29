import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  tutorUserId: string;
  studentUserId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    tutorUserId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true },
    studentName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export const ReviewModel =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
