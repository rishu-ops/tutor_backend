'use client';
import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

export interface SocketMessage {
  _id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  seen: boolean;
  createdAt: string;
}

export interface SocketNotification extends SocketMessage {
  senderName?: string;
}

export function useSocket() {
  const token = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const sock = getSocket(token);
    sock.auth = { token };
    sock.connect();
    socketRef.current = sock;

    return () => {
      // Do not disconnect on unmount - keep alive for floating widget
    };
  }, [token]);

  const joinRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit('join_room', conversationId);
  }, []);

  const leaveRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit('leave_room', conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('send_message', { conversationId, content });
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing_start', conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing_stop', conversationId);
  }, []);

  const markSeen = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_seen', conversationId);
  }, []);

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markSeen,
  };
}
