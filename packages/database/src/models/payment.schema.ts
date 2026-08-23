import mongoose, { Schema, Document } from 'mongoose';

// There is no real payment gateway wired into this platform — money still
// changes hands directly between student and tutor (UPI, bank transfer, cash).
// This model exists to give that exchange a paper trail: a two-sided
// confirmation (payer marks paid, payee confirms received) plus a dispute
// path, instead of the platform having zero record of payment ever happening.
export interface IPayment extends Document {
  contractId: string;
  bookingId?: string;
  payerUserId: string;
  payeeUserId: string;
  amount: number;
  currency: string;
  periodLabel: string; // e.g. "August 2026", or a specific session date
  method: string; // free text — UPI, bank transfer, cash, etc.
  status: 'PENDING' | 'MARKED_PAID' | 'CONFIRMED' | 'DISPUTED';
  markedPaidBy?: string;
  markedPaidAt?: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  disputedBy?: string;
  disputedAt?: Date;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    contractId: { type: String, required: true, index: true },
    bookingId: { type: String },
    payerUserId: { type: String, required: true, index: true },
    payeeUserId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    periodLabel: { type: String, required: true, maxlength: 200 },
    method: { type: String, default: '', maxlength: 100 },
    status: {
      type: String,
      enum: ['PENDING', 'MARKED_PAID', 'CONFIRMED', 'DISPUTED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    markedPaidBy: { type: String },
    markedPaidAt: { type: Date },
    confirmedBy: { type: String },
    confirmedAt: { type: Date },
    disputedBy: { type: String },
    disputedAt: { type: Date },
    disputeReason: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
