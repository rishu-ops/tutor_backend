import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  content: string;
  read: boolean;
  type?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false, required: true },
    type: { type: String, required: false },
    data: { type: Schema.Types.Mixed, required: false },
  },
  {
    timestamps: true,
  }
);

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
