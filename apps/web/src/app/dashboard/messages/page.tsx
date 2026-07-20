'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import {
  Lock,
  MessageSquare,
  Shield,
  Send,
  Compass,
  PlusCircle,
  XCircle,
  ChevronLeft,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Message {
  _id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Booking states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isFirstSession, setIsFirstSession] = useState(true);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingError, setBookingError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Always keep a ref to the latest selectedConvo to avoid stale closures in socket handlers
  const selectedConvoRef = useRef<Conversation | null>(null);
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
    async (convoId: string) => {
      if (!token) return;
      setLoadingMsgs(true);
      try {
        const res = await fetch(`/api/v1/conversations/${convoId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMessages(data.data || []);
      } catch {}
      setLoadingMsgs(false);
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

    sock.on('typing', ({ conversationId, userId, typing }: any) => {
      const currentConvo = selectedConvoRef.current;
      if (conversationId !== currentConvo?._id || userId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (typing) next.add(userId);
        else next.delete(userId);
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

    return () => {
      sock.off('new_message');
      sock.off('message_notification');
      sock.off('typing');
      sock.off('messages_seen');
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

  useEffect(() => {
    if (selectedConvo) {
      setMessages([]);
      fetchMessages(selectedConvo._id);
    }
  }, [selectedConvo?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedConvo || selectedConvo.status !== 'ACTIVE') return;
    playMessageSound('sent');
    const optimistic: Message = {
      _id: `opt-${Date.now()}`,
      conversationId: selectedConvo._id,
      senderUserId: user?.id || '',
      content: inputValue.trim(),
      seen: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current?.emit('send_message', {
      conversationId: selectedConvo._id,
      content: inputValue.trim(),
    });
    socketRef.current?.emit('typing_stop', selectedConvo._id);
    setInputValue('');
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!selectedConvo || selectedConvo.status !== 'ACTIVE') return;
    socketRef.current?.emit('typing_start', selectedConvo._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', selectedConvo._id);
    }, 1500);
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
              <MessageSquare className="w-5 h-5 text-[#00A453]" /> Conversations
            </h2>
            <p className="text-xs text-[#647380] mt-0.5 font-medium">
              Conversations open after you accept a tutor's proposal.
            </p>
          </div>

          {conversations.length > 0 && (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#dadee2] rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#00A453] transition-all font-semibold"
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
                    {convo.status === 'ACTIVE' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00A453] border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2d2d2d] truncate">
                        {convo.otherParty.name}
                      </span>
                      {convo.status === 'LOCKED' ? (
                        <span className="flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-600 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-200/50">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      ) : (
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200/50">
                          ACTIVE
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
                  {selectedConvo.status === 'ACTIVE' && (
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
                            <div
                              className={`max-w-[65%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                                isMine
                                  ? 'bg-[#00A453] text-white rounded-2xl rounded-br-sm'
                                  : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                              }`}
                            >
                              {msg.content}
                            </div>
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
            <div className="p-3 border-t border-[#dadee2] bg-white flex gap-2 items-center shrink-0">
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
                disabled={selectedConvo.status === 'LOCKED' || !inputValue.trim()}
                className="w-10 h-10 rounded-full bg-[#00A453] flex items-center justify-center disabled:opacity-40 hover:bg-[#008A45] transition-colors shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-300 animate-pulse" />
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
    </div>
  );
}
