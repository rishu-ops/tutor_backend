import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageAttachment {
  url: string;
  name: string;
  type: string; // mime type
  size: number; // bytes
}

export interface IMessage extends Document {
  conversationId: string;
  senderUserId: string;
  content: string;
  attachments?: IMessageAttachment[];
  seen: boolean;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderUserId: { type: String, required: true, index: true },
    content: { type: String, required: true, default: '' },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
      },
    ],
    seen: { type: Boolean, default: false },
    seenAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
