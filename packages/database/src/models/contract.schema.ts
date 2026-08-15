import mongoose, { Schema, Document } from 'mongoose';

export interface ISignatureInfo {
  signed: boolean;
  signedAt?: Date;
  signerName?: string;
}

export interface IContract extends Document {
  requirementId?: string;
  bookingId?: string;
  studentUserId: string;
  tutorUserId: string;
  subject: string;
  billingType: 'HOURLY' | 'MONTHLY';
  agreedRate: number;
  classesPerWeek: number;
  scheduleNotes?: string;
  terms: string[];
  studentSignature: ISignatureInfo;
  tutorSignature: ISignatureInfo;
  status: 'DRAFT' | 'PENDING_SIGNATURES' | 'ACTIVE' | 'TERMINATED';
  createdAt: Date;
  updatedAt: Date;
}

const SignatureSchema = new Schema<ISignatureInfo>(
  {
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signerName: { type: String },
  },
  { _id: false }
);

const ContractSchema = new Schema<IContract>(
  {
    requirementId: { type: String },
    bookingId: { type: String },
    studentUserId: { type: String, required: true, index: true },
    tutorUserId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    billingType: { type: String, enum: ['HOURLY', 'MONTHLY'], default: 'MONTHLY' },
    agreedRate: { type: Number, required: true },
    classesPerWeek: { type: Number, default: 3 },
    scheduleNotes: { type: String },
    terms: { type: [String], default: [] },
    studentSignature: { type: SignatureSchema, default: { signed: false } },
    tutorSignature: { type: SignatureSchema, default: { signed: false } },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'TERMINATED'],
      default: 'PENDING_SIGNATURES',
    },
  },
  { timestamps: true }
);

export const ContractModel =
  mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);
