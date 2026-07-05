import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: string;
  school: string;
  class: string;
  preferredLanguage: string;
  learningMode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    school: { type: String, required: true },
    class: { type: String, required: true },
    preferredLanguage: { type: String, required: true },
    learningMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'HYBRID'],
      required: true,
    },
    city: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const StudentProfileModel =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
