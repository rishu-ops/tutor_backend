import { Server, Socket } from 'socket.io';
import { MessageModel, ConversationModel, NotificationModel } from 'database';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
}

export function initSocketGateway(io: Server): void {
  // Broadcast general notifications in real-time
  NotificationModel.schema.post('save', (doc: any) => {
    io.to(`user:${doc.userId}`).emit('general_notification', {
      _id: doc._id.toString(),
      userId: doc.userId,
      title: doc.title,
      content: doc.content,
      read: doc.read,
      createdAt: doc.createdAt,
    });
  });

  // Auth middleware: validate JWT on every connection
  io.use((socket: AuthSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'secret';
      const payload = jwt.verify(token, secret) as { sub?: string; userId?: string };
      socket.userId = payload.sub || payload.userId;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket] User connected: ${userId} (${socket.id})`);

    // Join personal room to receive direct messages
    socket.join(`user:${userId}`);

    // Broadcast online presence to all conversation partners
    (async () => {
      try {
        const conversations = await ConversationModel.find({
          $or: [{ studentUserId: userId }, { tutorUserId: userId }],
        });
        for (const convo of conversations) {
          const otherUserId =
            convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
          // Notify the other party that this user came online
          io.to(`user:${otherUserId}`).emit('user_online', { userId });
          // Check if the other party is online and notify this user
          const otherSockets = await io.in(`user:${otherUserId}`).fetchSockets();
          if (otherSockets.length > 0) {
            socket.emit('user_online', { userId: otherUserId });
          }
        }
      } catch (err) {
        console.error('[Socket] presence broadcast error:', err);
      }
    })();

    // ── Join a conversation room ──────────────────────────────────────────
    socket.on('join_room', async (conversationId: string) => {
      try {
        const convo = await ConversationModel.findById(conversationId);
        if (!convo) return;
        if (convo.studentUserId !== userId && convo.tutorUserId !== userId) return;

        socket.join(`room:${conversationId}`);
        console.log(`[Socket] ${userId} joined room:${conversationId}`);

        // Mark messages from the other party as seen
        await MessageModel.updateMany(
          { conversationId, senderUserId: { $ne: userId }, seen: false },
          { $set: { seen: true, seenAt: new Date() } }
        );

        // Notify sender their messages were seen
        const otherUserId =
          convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
        io.to(`user:${otherUserId}`).emit('messages_seen', { conversationId });
      } catch (err) {
        console.error('[Socket] join_room error:', err);
      }
    });

    // ── Leave a conversation room ─────────────────────────────────────────
    socket.on('leave_room', (conversationId: string) => {
      socket.leave(`room:${conversationId}`);
    });

    // ── Send a message ────────────────────────────────────────────────────
    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = data;
        if (!conversationId || !content?.trim()) return;

        const convo = await ConversationModel.findById(conversationId);
        if (!convo || convo.status !== 'ACTIVE') return;
        if (convo.studentUserId !== userId && convo.tutorUserId !== userId) return;

        const message = await MessageModel.create({
          conversationId,
          senderUserId: userId,
          content: content.trim(),
        });

        const msgData = {
          _id: message._id.toString(),
          conversationId,
          senderUserId: userId,
          content: message.content,
          seen: false,
          createdAt: message.createdAt,
        };

        // Broadcast to both parties in the room
        io.to(`room:${conversationId}`).emit('new_message', msgData);

        // Also notify the other party's personal room (for floating widget)
        const otherUserId =
          convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
        io.to(`user:${otherUserId}`).emit('message_notification', {
          ...msgData,
          senderName: '', // Will be enriched on frontend from conversation data
          conversationId,
        });

        // Update conversation updatedAt for sorting
        await ConversationModel.findByIdAndUpdate(conversationId, {
          updatedAt: new Date(),
          lastMessage: content.trim(),
          lastMessageAt: new Date(),
        });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────────
    socket.on('typing_start', async (conversationId: string) => {
      try {
        const convo = await ConversationModel.findById(conversationId);
        if (!convo) return;
        const otherUserId =
          convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
        io.to(`user:${otherUserId}`).emit('typing', { conversationId, userId, typing: true });
      } catch (err) {
        console.error('[Socket] typing_start error:', err);
      }
    });

    socket.on('typing_stop', async (conversationId: string) => {
      try {
        const convo = await ConversationModel.findById(conversationId);
        if (!convo) return;
        const otherUserId =
          convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
        io.to(`user:${otherUserId}`).emit('typing', { conversationId, userId, typing: false });
      } catch (err) {
        console.error('[Socket] typing_stop error:', err);
      }
    });

    // ── Mark messages seen ────────────────────────────────────────────────
    socket.on('mark_seen', async (conversationId: string) => {
      try {
        const convo = await ConversationModel.findById(conversationId);
        if (!convo) return;
        if (convo.studentUserId !== userId && convo.tutorUserId !== userId) return;

        await MessageModel.updateMany(
          { conversationId, senderUserId: { $ne: userId }, seen: false },
          { $set: { seen: true, seenAt: new Date() } }
        );

        const otherUserId =
          convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
        io.to(`user:${otherUserId}`).emit('messages_seen', { conversationId });
      } catch (err) {
        console.error('[Socket] mark_seen error:', err);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      // Broadcast typing_stop and offline presence to every room this socket was in
      try {
        const convos = await ConversationModel.find({
          $or: [{ studentUserId: userId }, { tutorUserId: userId }],
        });
        for (const convo of convos) {
          const otherUserId =
            convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
          // Clear typing indicator
          io.to(`user:${otherUserId}`).emit('typing', {
            conversationId: convo._id.toString(),
            userId,
            typing: false,
          });
          // Broadcast offline
          io.to(`user:${otherUserId}`).emit('user_offline', { userId });
        }
      } catch (err) {
        console.error('[Socket] disconnect cleanup error:', err);
      }
    });
  });
}
