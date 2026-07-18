import mongoose, { Schema, Document } from 'mongoose';

export interface ITutorSubject {
  subject: string;
  level: string;
  experienceYears: number;
}

export interface ITutorQualification {
  degree: string;
  institution: string;
  year: number;
}

export interface ITutorPricing {
  min: number;
  max: number;
}

export interface ITutorLocation {
  city: string;
  area: string;
  lat?: number;
  lng?: number;
}

export interface ITutorProfile extends Document {
  userId: string;
  bio: string;
  subjects: ITutorSubject[];
  qualifications: ITutorQualification[];
  teachingModes: string[];
  languages: string[];
  pricing: ITutorPricing;
  location: ITutorLocation;
  availability: string[];
  offersDemo: boolean;
  profileCompleteness: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  visibilityTier: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TutorSubjectSchema = new Schema<ITutorSubject>(
  {
    subject: { type: String, required: true },
    level: { type: String, required: true },
    experienceYears: { type: Number, required: true },
  },
  { _id: false }
);

const TutorQualificationSchema = new Schema<ITutorQualification>(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { _id: false }
);

const TutorPricingSchema = new Schema<ITutorPricing>(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false }
);

const TutorLocationSchema = new Schema<ITutorLocation>(
  {
    city: { type: String, required: true },
    area: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const TutorProfileSchema = new Schema<ITutorProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    bio: { type: String, required: true },
    subjects: { type: [TutorSubjectSchema], default: [] },
    qualifications: { type: [TutorQualificationSchema], default: [] },
    teachingModes: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    pricing: { type: TutorPricingSchema, required: true },
    location: { type: TutorLocationSchema, required: true },
    availability: { type: [String], default: [] },
    offersDemo: { type: Boolean, default: true },
    profileCompleteness: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    visibilityTier: {
      type: String,
      enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
      default: 'FREE',
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const TutorProfileModel =
  mongoose.models.TutorProfile || mongoose.model<ITutorProfile>('TutorProfile', TutorProfileSchema);
