import mongoose, { Schema, Document } from 'mongoose';

export interface ITutorRequirementMatch extends Document {
  tutorUserId: string;
  requirementId: string;
  score: number;
  strength: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  breakdown: {
    subjectMatch: boolean;
    levelMatch: boolean;
    modeMatch: boolean;
    locationMatch: boolean;
    budgetMatch: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TutorRequirementMatchSchema = new Schema<ITutorRequirementMatch>(
  {
    tutorUserId: { type: String, required: true, index: true },
    requirementId: { type: String, required: true, index: true },
    score: { type: Number, default: 0 },
    strength: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    breakdown: {
      type: {
        subjectMatch: { type: Boolean, default: false },
        levelMatch: { type: Boolean, default: false },
        modeMatch: { type: Boolean, default: false },
        locationMatch: { type: Boolean, default: false },
        budgetMatch: { type: Boolean, default: false },
      },
      default: {},
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of tutor-requirement matches
TutorRequirementMatchSchema.index({ tutorUserId: 1, requirementId: 1 }, { unique: true });

export const TutorRequirementMatchModel =
  mongoose.models.TutorRequirementMatch ||
  mongoose.model<ITutorRequirementMatch>('TutorRequirementMatch', TutorRequirementMatchSchema);
