'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import {
  Lock,
  MessageSquareText,
  Shield,
  Send,
  Compass,
  PlusCircle,
  XCircle,
  ChevronLeft,
  Check,
  CheckCheck,
  Search,
  Paperclip,
  FileText,
  Download,
  X,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ContractSigningModal } from '@/components/sections/ContractSigningModal';

interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface Message {
  _id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  attachments?: MessageAttachment[];
  seen: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  status: 'ACTIVE' | 'LOCKED';
  otherParty: { id: string; name: string; role: string };
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    if (date !== currentDate) {
      groups.push({ date, messages: [msg] });
      currentDate = date;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

function playMessageSound(type: 'sent' | 'received') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'sent') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

export default function MessagesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();

  const targetUserId = searchParams.get('userId') || searchParams.get('tutorId');
  const targetConvoId = searchParams.get('convoId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  // Real-time presence: set of userIds currently online
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Booking & Contract states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isFirstSession, setIsFirstSession] = useState(true);
  const [sessionMode, setSessionMode] = useState<'ONLINE' | 'ONSITE'>('ONLINE');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Contract state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Sender side: debounce typing_stop after last keystroke
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Sender side: track whether typing_start has already been emitted for this burst
  const isTypingRef = useRef(false);
  // Receiver side: auto-clear stuck typing indicator if typing_stop is never received
  const receiverTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Always keep a ref to the latest selectedConvo to avoid stale closures in socket handlers
  const selectedConvoRef = useRef<Conversation | null>(null);

  // File sharing
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<MessageAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const DAILY_FILE_LIMIT = 5;
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
  }, [selectedConvo]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedConvo || !bookingDate || !bookingTime) return;
    setBookingError('');
    setBookingMsg('');
    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requirementId: selectedConvo._id,
          tutorUserId: selectedConvo.otherParty.id,
          scheduledAt: new Date(`${bookingDate}T${bookingTime}`).toISOString(),
          isFirstSession,
          sessionMode,
          notes: bookingNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingMsg(
          isFirstSession
            ? 'Trial class request sent! Waiting for tutor confirmation.'
            : 'Regular session request sent!'
        );
        setTimeout(() => {
          setIsBookingOpen(false);
          setBookingMsg('');
        }, 2500);
      } else {
        setBookingError(data.error || 'Failed to send request.');
      }
    } catch {
      setBookingError('Connection failure.');
    }
  };

  const handleUpdateBooking = async (bookingId: string, status: 'ACCEPTED' | 'DECLINED') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success && selectedConvo) {
        fetchMessages(selectedConvo._id);
      } else {
        alert(data.error || 'Failed to update booking status');
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConversations(data.data || []);
    } catch {}
    setLoading(false);
  }, [token]);

  const fetchMessages = useCallback(
    async (convoId: string, silent = false) => {
      if (!token) return;
      if (!silent) setLoadingMsgs(true);
      try {
        const res = await fetch(`/api/v1/conversations/${convoId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const fetched: Message[] = data.data || [];
          setMessages((prev) => {
            // Keep any optimistic messages that haven't been confirmed yet
            const optimistics = prev.filter((m) => m._id.startsWith('opt-'));
            const fetchedIds = new Set(fetched.map((m) => m._id));
            const stillPending = optimistics.filter((m) => !fetchedIds.has(m._id));
            return [...fetched, ...stillPending];
          });
        }
      } catch {}
      if (!silent) setLoadingMsgs(false);
    },
    [token]
  );

  // Socket — runs once per token/user; reads selectedConvo from ref to avoid stale closures
  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.auth = { token };
    if (!sock.connected) sock.connect();
    socketRef.current = sock;

    sock.on('new_message', (msg: Message) => {
      const currentConvo = selectedConvoRef.current;
      if (msg.senderUserId !== user?.id) {
        playMessageSound('received');
      }
      if (msg.conversationId === currentConvo?._id) {
        setMessages((prev) => {
          // Remove optimistic duplicate
          const filtered = prev.filter(
            (m) => !m._id.startsWith('opt-') || m.content !== msg.content
          );
          return [...filtered, msg];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
            : c
        )
      );
    });

    // Also handle message_notification as a fallback
    sock.on('message_notification', (notif: any) => {
      const currentConvo = selectedConvoRef.current;
      if (notif.senderUserId === user?.id) return;
      playMessageSound('received');
      setConversations((prev) =>
        prev.map((c) =>
          c._id === notif.conversationId
            ? { ...c, lastMessage: notif.content, lastMessageAt: notif.createdAt }
            : c
        )
      );
      if (notif.conversationId === currentConvo?._id) {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === notif._id);
          if (alreadyExists) return prev;
          return [...prev, notif];
        });
      }
    });

    sock.on('user_online', ({ userId: uid }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(uid));
    });

    sock.on('user_offline', ({ userId: uid }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    });

    sock.on('typing', ({ conversationId, userId, typing }: any) => {
      const currentConvo = selectedConvoRef.current;
      if (conversationId !== currentConvo?._id || userId === user?.id) return;
      // Clear any pending auto-clear timer
      if (receiverTypingTimeoutRef.current) clearTimeout(receiverTypingTimeoutRef.current);
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (typing) {
          next.add(userId);
          // Auto-clear after 4s in case typing_stop is never received
          receiverTypingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Set(p);
              n.delete(userId);
              return n;
            });
          }, 4000);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    sock.on('messages_seen', ({ conversationId }: { conversationId: string }) => {
      const currentConvo = selectedConvoRef.current;
      if (conversationId === currentConvo?._id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderUserId === user?.id ? { ...m, seen: true } : m))
        );
      }
    });

    // Re-join the active room after any reconnect so new_message events resume
    const handleReconnect = () => {
      const currentConvo = selectedConvoRef.current;
      if (currentConvo) {
        sock.emit('join_room', currentConvo._id);
        console.log('[Socket] Reconnected — rejoined room:', currentConvo._id);
      }
    };
    sock.on('connect', handleReconnect);

    return () => {
      sock.off('new_message');
      sock.off('message_notification');
      sock.off('user_online');
      sock.off('user_offline');
      sock.off('typing');
      sock.off('messages_seen');
      sock.off('connect', handleReconnect);
    };
  }, [token, user?.id]);

  // Join/leave room when the selected conversation changes
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;
    if (selectedConvo) {
      sock.emit('join_room', selectedConvo._id);
    }
    return () => {
      if (selectedConvo && socketRef.current) {
        socketRef.current.emit('leave_room', selectedConvo._id);
      }
    };
  }, [selectedConvo?._id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-select conversation matching targetUserId or targetConvoId from URL query parameters
  useEffect(() => {
    if (conversations.length === 0) return;

    if (targetConvoId) {
      const match = conversations.find((c) => c._id === targetConvoId);
      if (match) {
        setSelectedConvo(match);
        setShowMobileChat(true);
        return;
      }
    }

    if (targetUserId) {
      const match = conversations.find((c) => c.otherParty.id === targetUserId);
      if (match) {
        setSelectedConvo(match);
        setShowMobileChat(true);
        return;
      }
    }

    // Default: select first conversation if none selected yet
    if (!selectedConvo && conversations.length > 0) {
      setSelectedConvo(conversations[0]);
    }
  }, [conversations, targetUserId, targetConvoId]);

  useEffect(() => {
    if (selectedConvo) {
      setMessages([]);
      fetchMessages(selectedConvo._id);
    }
  }, [selectedConvo?._id]);

  // Polling fallback: silently re-fetch messages every 8s while a conversation is open
  // This ensures messages appear even if the socket fails to deliver them
  useEffect(() => {
    if (!selectedConvo) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConvo._id, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConvo?._id, fetchMessages]);

  // Clear typing state when conversation changes
  useEffect(() => {
    // Clear any lingering sender-side typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    // Clear receiver-side typing indicator and auto-clear timer
    if (receiverTypingTimeoutRef.current) clearTimeout(receiverTypingTimeoutRef.current);
    setTypingUsers(new Set());
  }, [selectedConvo?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (
      (!inputValue.trim() && pendingFiles.length === 0) ||
      !selectedConvo ||
      selectedConvo.status !== 'ACTIVE'
    )
      return;
    // Clear sender-side typing state immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      socketRef.current?.emit('typing_stop', selectedConvo._id);
      isTypingRef.current = false;
    }
    playMessageSound('sent');
    const optimistic: Message = {
      _id: `opt-${Date.now()}`,
      conversationId: selectedConvo._id,
      senderUserId: user?.id || '',
      content: inputValue.trim(),
      attachments: pendingFiles,
      seen: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current?.emit('send_message', {
      conversationId: selectedConvo._id,
      content: inputValue.trim(),
      attachments: pendingFiles,
    });
    setInputValue('');
    setPendingFiles([]);
  };

  // Upload a file to /api/v1/media/upload-chat-file and stage it as a pending attachment
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setFileError('');

    if (pendingFiles.length >= DAILY_FILE_LIMIT) {
      setFileError(`Max ${DAILY_FILE_LIMIT} files per session.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File too large. Max 5 MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/media/upload-chat-file', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setPendingFiles((prev) => [
          ...prev,
          { url: data.url, name: data.name, type: data.type, size: data.size },
        ]);
      } else {
        setFileError(data.error || 'Upload failed.');
      }
    } catch {
      setFileError('Upload failed. Try again.');
    }
    setUploadingFile(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!selectedConvo || selectedConvo.status !== 'ACTIVE') return;
    // Only emit typing_start once per burst (not on every keystroke)
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current?.emit('typing_start', selectedConvo._id);
    }
    // Reset the stop timer on every keystroke
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', selectedConvo._id);
      isTypingRef.current = false;
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((convo) =>
    convo.otherParty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] bg-white border border-[#dadee2] rounded-3xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div
        className={`w-full md:w-80 border-r border-[#dadee2] flex flex-col bg-[#FAFAFA] shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="p-4 border-b border-[#dadee2] space-y-3 bg-[#FAFAFA]">
          <div>
            <h2 className="text-base font-extrabold text-[#2d2d2d] flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-[#00A453]" /> Messages
            </h2>
            <p className="text-xs text-[#647380] mt-0.5 font-medium">
              Conversations open after you accept a tutor's proposal.
            </p>
          </div>

          {conversations.length > 0 && (
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#dadee2] rounded-xl pl-10 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#00A453] transition-all font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-400 hover:text-[#2d2d2d] transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && conversations.length === 0 ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex items-center gap-3 bg-white animate-pulse rounded-2xl border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-150 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-150 rounded w-1/2" />
                    <div className="h-3 bg-gray-150 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[#647380] mt-12 gap-3">
              <Compass className="w-8 h-8 text-gray-300" />
              <span className="font-semibold leading-normal">
                No chats yet — accept a tutor proposal to start talking.
              </span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[#647380] mt-12 gap-2">
              <Search className="w-6 h-6 text-gray-300" />
              <span className="font-semibold">No matches found for &quot;{searchQuery}&quot;</span>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isSelected = selectedConvo?._id === convo._id;
              return (
                <button
                  key={convo._id}
                  onClick={() => {
                    setSelectedConvo(convo);
                    setShowMobileChat(true);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-white shadow-sm border border-[#dadee2]'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-[#e6f6ee] border border-[#00A453]/25 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#00A453]">
                        {getInitials(convo.otherParty.name)}
                      </span>
                    </div>
                    {/* Only show green dot when the other user is actually online */}
                    {onlineUsers.has(convo.otherParty.id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00A453] border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2d2d2d] truncate">
                        {convo.otherParty.name}
                      </span>
                      {/* Only show lock badge for locked conversations; remove ACTIVE tag */}
                      {convo.status === 'LOCKED' && (
                        <span className="flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-600 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-200/50">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#647380] truncate mt-0.5 font-medium">
                      {convo.lastMessage ||
                        (convo.status === 'ACTIVE'
                          ? 'Start a conversation...'
                          : 'Awaiting acceptance')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Viewport */}
      <div
        className={`flex-1 flex flex-col bg-white ${showMobileChat ? 'flex' : 'hidden md:flex'}`}
      >
        {selectedConvo ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#dadee2] bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1 hover:bg-gray-200 rounded-full transition-colors shrink-0 mr-1"
                >
                  <ChevronLeft className="w-5 h-5 text-[#00A453] stroke-[3]" />
                </button>
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#00A453]">
                      {getInitials(selectedConvo.otherParty.name)}
                    </span>
                  </div>
                  {onlineUsers.has(selectedConvo.otherParty.id) && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#00A453] border border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#2d2d2d] leading-none">
                    {selectedConvo.otherParty.name}
                  </h3>
                  {typingUsers.size > 0 ? (
                    <span className="text-xs text-[#00A453] font-semibold block mt-1">
                      typing...
                    </span>
                  ) : onlineUsers.has(selectedConvo.otherParty.id) ? (
                    <span className="text-xs text-[#00A453] font-semibold block mt-1">Online</span>
                  ) : (
                    <span className="text-xs text-[#647380] capitalize block mt-1">
                      {selectedConvo.otherParty.role.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConvo.status === 'ACTIVE' && user?.role === 'STUDENT' && (
                  <Button
                    onClick={() => setIsBookingOpen(true)}
                    className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Book Class
                  </Button>
                )}
                {selectedConvo.status === 'LOCKED' && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </div>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
              style={{
                backgroundColor: '#f6f8f9',
                backgroundImage: 'radial-gradient(rgba(0, 164, 83, 0.06) 1.5px, transparent 1.5px)',
                backgroundSize: '20px 20px',
              }}
            >
              {selectedConvo.status === 'LOCKED' ? (
                <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200/50 rounded-full flex items-center justify-center text-amber-500 shadow-sm animate-pulse">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-[#2d2d2d]">
                      Chat Unlocks After Acceptance
                    </h4>
                    <p className="text-xs text-[#647380] leading-relaxed font-semibold">
                      Once the tutor&apos;s proposal is accepted, you will be able to chat and
                      coordinate details directly.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 px-3 py-2 rounded-xl text-[10px] text-[#647380] font-bold">
                    <Shield className="w-3.5 h-3.5 text-[#00A453]" />
                    Conversations are secured for student safety
                  </div>
                </div>
              ) : loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-[#00A453] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 space-y-5">
                  {/* Avatar + greeting */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-[#e6f6ee] border border-[#00A453]/25 flex items-center justify-center mx-auto shadow-sm">
                      <span className="text-lg font-extrabold text-[#00A453]">
                        {getInitials(selectedConvo.otherParty.name)}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-[#2d2d2d]">
                      Say hello to {selectedConvo.otherParty.name}!
                    </p>
                    <p className="text-xs text-[#647380] font-medium">
                      This is the beginning of your conversation. Start with a quick intro below.
                    </p>
                  </div>

                  {/* Suggested messages */}
                  <div className="w-full max-w-sm space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#647380] text-center">
                      Suggested messages
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(user?.role === 'STUDENT'
                        ? [
                            `Hi! I'm looking forward to working with you.`,
                            `Can we schedule our first session this week?`,
                            `What's the best time to connect for a trial class?`,
                            `Could you share your teaching approach for ${selectedConvo.otherParty.name.split(' ')[0]}'s subject?`,
                            `I have a few questions before we start. Is now a good time?`,
                          ]
                        : [
                            `Hi! Happy to be connected with you.`,
                            `When would you like to schedule the first session?`,
                            `I'd love to understand your learning goals better.`,
                            `I can start with a free 15-min intro call. Interested?`,
                            `Feel free to ask me anything about the curriculum!`,
                          ]
                      ).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setInputValue(suggestion)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#dadee2] text-[#2d2d2d] hover:border-[#00A453] hover:text-[#00A453] hover:bg-[#f0fbf6] transition-all duration-150 shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messageGroups.map((group) => (
                    <React.Fragment key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[10px] font-semibold text-gray-400 bg-[#f0f2f5] px-3 py-1 rounded-full border border-gray-200/60">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg, i) => {
                        const isMine = msg.senderUserId === user?.id;
                        const isLast = i === group.messages.length - 1;
                        const nextMsg = group.messages[i + 1];
                        const showTime =
                          isLast ||
                          !nextMsg ||
                          new Date(nextMsg.createdAt).getTime() -
                            new Date(msg.createdAt).getTime() >
                            5 * 60 * 1000;
                        return (
                          <div
                            key={msg._id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-0.5`}
                          >
                            {/* Text bubble or Interactive Cards */}
                            {msg.content && msg.content.startsWith('📜 CONTRACT_PROPOSAL:') ? (
                              (() => {
                                const parts = msg.content.split(':');
                                const contractId = parts[1];
                                const subject = parts[2] || 'Tuition Engagement';
                                const billingType = parts[3] || 'MONTHLY';
                                const agreedRate = parts[4] || '0';
                                const classesPerWeek = parts[5] || '3';
                                const scheduleNotes = parts.slice(6).join(':') || '';
                                return (
                                  <div className="max-w-[340px] bg-white border border-[#dadee2] rounded-2xl p-4 shadow-sm text-[#2d2d2d] space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full border border-[#00A453]/20 flex items-center gap-1">
                                        📜 Tutoring Agreement
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">
                                        Official Contract
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <h4 className="text-sm font-extrabold text-[#2d2d2d]">
                                        {subject}
                                      </h4>
                                      <div className="text-xs font-black text-[#00A453]">
                                        ₹{agreedRate} / {billingType.toLowerCase()} (
                                        {classesPerWeek} sessions/wk)
                                      </div>
                                      {scheduleNotes && (
                                        <p className="text-xs text-[#384148] italic bg-gray-50 p-2 rounded-xl border border-gray-150">
                                          "{scheduleNotes}"
                                        </p>
                                      )}
                                    </div>

                                    <Button
                                      onClick={() => {
                                        setSelectedContractId(contractId);
                                        setIsContractModalOpen(true);
                                      }}
                                      size="sm"
                                      className="w-full bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs h-8 rounded-xl shadow-xs gap-1.5"
                                    >
                                      ✍ Review & Sign Agreement
                                    </Button>
                                  </div>
                                );
                              })()
                            ) : msg.content && msg.content.startsWith('📅 BOOKING_REQUEST:') ? (
                              (() => {
                                const parts = msg.content.split(':');
                                const bookingId = parts[1];
                                const subject = parts[2] || 'Class Session';
                                const sessionLabel = parts[3] || 'Trial Class';
                                const timeStr = parts[4] || 'Scheduled Time';
                                const notes = parts.slice(5).join(':') || '';
                                return (
                                  <div className="max-w-[340px] bg-white border border-[#dadee2] rounded-2xl p-4 shadow-sm text-[#2d2d2d] space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full border border-[#00A453]/20 flex items-center gap-1">
                                        📅 {sessionLabel} Proposed
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">
                                        Class Booking
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <h4 className="text-sm font-extrabold text-[#2d2d2d]">
                                        {subject}
                                      </h4>
                                      <p className="text-xs text-[#647380] font-medium">
                                        🕒 {timeStr}
                                      </p>
                                      {notes && (
                                        <p className="text-xs text-[#384148] italic bg-gray-50 p-2 rounded-xl border border-gray-150">
                                          "{notes}"
                                        </p>
                                      )}
                                    </div>

                                    {!isMine ? (
                                      <div className="flex items-center gap-2 pt-1">
                                        <Button
                                          onClick={() => handleUpdateBooking(bookingId, 'ACCEPTED')}
                                          size="sm"
                                          className="flex-1 bg-[#00A453] hover:bg-[#009048] text-white font-bold text-xs h-8 rounded-xl shadow-xs"
                                        >
                                          ✓ Accept Class
                                        </Button>
                                        <Button
                                          onClick={() => handleUpdateBooking(bookingId, 'DECLINED')}
                                          size="sm"
                                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs h-8 rounded-xl"
                                        >
                                          ✕ Decline
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] font-semibold text-gray-500 bg-gray-50 p-2 rounded-xl text-center border border-gray-150">
                                        ● Booking request sent. Waiting for confirmation.
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : msg.content && msg.content.startsWith('STATUS_UPDATE:') ? (
                              (() => {
                                const parts = msg.content.split(':');
                                const status = parts[2];
                                const text = parts.slice(3).join(':');
                                const isSuccess = status === 'ACCEPTED';
                                const isDanger = status === 'DECLINED' || status === 'CANCELLED';
                                return (
                                  <div
                                    className={`max-w-[320px] rounded-2xl p-3 border text-xs font-bold shadow-xs ${
                                      isSuccess
                                        ? 'bg-[#e6f6ee] text-[#00A453] border-[#00A453]/30'
                                        : isDanger
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : 'bg-gray-50 text-gray-800 border-gray-200'
                                    }`}
                                  >
                                    {text}
                                  </div>
                                );
                              })()
                            ) : msg.content ? (
                              <div
                                className={`max-w-[65%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                                  isMine
                                    ? 'bg-[#00A453] text-white rounded-2xl rounded-br-sm'
                                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                                }`}
                              >
                                {msg.content}
                              </div>
                            ) : null}
                            {/* Attachments */}
                            {(msg.attachments || []).map((att, ai) => {
                              const isImage = att.type.startsWith('image/');
                              return (
                                <div
                                  key={ai}
                                  className={`mt-1 max-w-[65%] ${
                                    isMine ? 'items-end' : 'items-start'
                                  }`}
                                >
                                  {isImage ? (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="max-w-[220px] max-h-[200px] object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={att.name}
                                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                                        isMine
                                          ? 'bg-[#008A45] text-white border-[#007a3c] hover:bg-[#007a3c]'
                                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate max-w-[140px]">{att.name}</span>
                                      <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                            {showTime && (
                              <div
                                className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row-reverse' : ''}`}
                              >
                                <span className="text-[9px] text-gray-400">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMine && (
                                  <span className={msg.seen ? 'text-[#00A453]' : 'text-gray-400'}>
                                    {msg.seen ? (
                                      <CheckCheck className="w-3 h-3" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  {typingUsers.size > 0 && (
                    <div className="flex items-start mt-1">
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1 items-center">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-[#dadee2] bg-white flex flex-col gap-2 shrink-0">
              {/* Pending file attachments preview */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {pendingFiles.map((f, i) => {
                    const isImage = f.type.startsWith('image/');
                    return (
                      <div
                        key={i}
                        className="relative flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 max-w-[160px]"
                      >
                        {isImage ? (
                          <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        )}
                        <span className="truncate">{f.name}</span>
                        <button
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="ml-0.5 text-gray-400 hover:text-red-500 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* File error message */}
              {fileError && (
                <p className="text-[10px] text-red-500 font-semibold px-1">{fileError}</p>
              )}
              <div className="flex gap-2 items-center">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {/* Attachment button */}
                <button
                  onClick={() => {
                    setFileError('');
                    fileInputRef.current?.click();
                  }}
                  disabled={
                    selectedConvo.status === 'LOCKED' ||
                    uploadingFile ||
                    pendingFiles.length >= DAILY_FILE_LIMIT
                  }
                  title={`Attach file (max 5 MB, ${DAILY_FILE_LIMIT}/day)`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-[#00A453] hover:bg-[#f0fbf6] border border-[#dadee2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {uploadingFile ? (
                    <span className="w-4 h-4 border-2 border-[#00A453] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="text"
                  disabled={selectedConvo.status === 'LOCKED'}
                  placeholder={
                    selectedConvo.status === 'LOCKED'
                      ? 'Accept proposal to unlock chat...'
                      : 'Type a message...'
                  }
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    selectedConvo.status === 'LOCKED' ||
                    (!inputValue.trim() && pendingFiles.length === 0)
                  }
                  className="w-10 h-10 rounded-full bg-[#00A453] flex items-center justify-center disabled:opacity-40 hover:bg-[#008A45] transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <MessageSquareText className="w-10 h-10 text-gray-300 animate-pulse" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2d2d2d]">Select a Conversation</h3>
              <p className="text-xs text-[#647380] mt-1 max-w-xs">
                Pick a conversation from the sidebar to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Session Request Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-[#00060c]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#dadee2] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-md font-extrabold text-gray-950">Request a Session</h3>
              <button
                onClick={() => {
                  setIsBookingOpen(false);
                  setBookingError('');
                  setBookingMsg('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Session type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsFirstSession(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isFirstSession
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <p className="text-xs font-extrabold">✦ Trial Class</p>
                <p className="text-[10px] mt-0.5 opacity-70">First session to evaluate fit</p>
              </button>
              <button
                type="button"
                onClick={() => setIsFirstSession(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !isFirstSession
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <p className="text-xs font-extrabold">Regular Session</p>
                <p className="text-[10px] mt-0.5 opacity-70">Ongoing tutoring session</p>
              </button>
            </div>

            {/* Delivery mode selector — this is what the session actually gets booked as */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Session Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSessionMode('ONLINE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    sessionMode === 'ONLINE'
                      ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  💻 Online
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('ONSITE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    sessionMode === 'ONSITE'
                      ? 'border-[#00A453] bg-[#e6f6ee] text-[#00A453]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  🏠 Onsite / In-person
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                The request will be rejected if the tutor doesn't offer this mode.
              </p>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] font-semibold text-red-700">
                {bookingError}
              </div>
            )}
            {bookingMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-700">
                {bookingMsg}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-gray-50 border border-[#dadee2] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-gray-50 border border-[#dadee2] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00A453]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Topics / Notes (optional)
                </label>
                <textarea
                  placeholder="e.g. Class 12 integration chapter, NCERT Exercise 7.1"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-[#dadee2] rounded-xl px-3 py-2 text-xs h-16 focus:outline-none focus:border-[#00A453] resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  className="bg-[#00A453] hover:bg-[#008A45] text-white font-bold text-xs h-10 rounded-xl flex-1"
                >
                  Send {isFirstSession ? 'Trial' : 'Session'} Request
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  variant="secondary"
                  className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs h-10 rounded-xl px-4"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Signing Modal */}
      <ContractSigningModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractId={selectedContractId}
        onContractSigned={() => {
          if (selectedConvo) fetchMessages(selectedConvo._id);
        }}
      />
    </div>
  );
}
