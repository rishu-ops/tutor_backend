import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  requirementId: string;
  studentUserId: string;
  tutorUserId: string;
  applicationId: string;
  status: 'LOCKED' | 'ACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    requirementId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true, index: true },
    tutorUserId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['LOCKED', 'ACTIVE'],
      default: 'LOCKED',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for checking existing conversation between student & tutor for a requirement
ConversationSchema.index({ requirementId: 1, studentUserId: 1, tutorUserId: 1 }, { unique: true });

export const ConversationModel =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
