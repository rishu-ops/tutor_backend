'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getSocket } from '@/lib/socket';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageSquareText,
  MessageSquare,
  X,
  Send,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Pencil,
  Check,
  CheckCheck,
  Lock,
} from 'lucide-react';
import { Socket } from 'socket.io-client';

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
  unreadCount?: number;
}

interface ToastNotification {
  id: string;
  conversationId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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

export default function FloatingChatWidget() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openConvoId, setOpenConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [typingConvoIds, setTypingConvoIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const openConvo = conversations.find((c) => c._id === openConvoId);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch {}
  }, [token]);

  // Fetch messages for open conversation
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

  // Socket setup
  useEffect(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.auth = { token };
    if (!sock.connected) sock.connect();
    socketRef.current = sock;

    sock.on('new_message', (msg: Message) => {
      if (msg.senderUserId !== user?.id) {
        playMessageSound('received');
      }
      setMessages((prev) => {
        // Only add if for open conversation
        if (msg.conversationId === openConvoId) {
          return [...prev, msg];
        }
        return prev;
      });
      // Update last message in convo list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
            : c
        )
      );
    });

    sock.on(
      'message_notification',
      (notif: {
        conversationId: string;
        senderUserId: string;
        content: string;
        senderName?: string;
      }) => {
        if (notif.senderUserId === user?.id) return;
        playMessageSound('received');
        // Increment unread
        setUnreadCounts((prev) => ({
          ...prev,
          [notif.conversationId]: (prev[notif.conversationId] || 0) + 1,
        }));
        // Show toast if widget collapsed or different convo open
        if (!isExpanded || openConvoId !== notif.conversationId) {
          const senderConvo = conversations.find((c) => c._id === notif.conversationId);
          const senderName = notif.senderName || senderConvo?.otherParty.name || 'Someone';
          const toast: ToastNotification = {
            id: `${Date.now()}`,
            conversationId: notif.conversationId,
            senderName,
            content: notif.content,
            timestamp: Date.now(),
          };
          setToasts((prev) => [...prev.slice(-2), toast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 5000);
        }
        // Update convo list last message
        setConversations((prev) =>
          prev.map((c) =>
            c._id === notif.conversationId ? { ...c, lastMessage: notif.content } : c
          )
        );
      }
    );

    sock.on(
      'typing',
      ({
        conversationId,
        userId,
        typing,
      }: {
        conversationId: string;
        userId: string;
        typing: boolean;
      }) => {
        if (userId === user?.id) return;
        setTypingConvoIds((prev) => {
          const next = new Set(prev);
          if (typing) next.add(conversationId);
          else next.delete(conversationId);
          return next;
        });
      }
    );

    sock.on('messages_seen', ({ conversationId }: { conversationId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === conversationId && m.senderUserId === user?.id
            ? { ...m, seen: true }
            : m
        )
      );
    });

    sock.on('general_notification', (notif: any) => {
      playMessageSound('received');
      window.dispatchEvent(new CustomEvent('new_general_notification', { detail: notif }));
    });

    return () => {
      sock.off('new_message');
      sock.off('message_notification');
      sock.off('typing');
      sock.off('messages_seen');
      sock.off('general_notification');
    };
  }, [token, user?.id, openConvoId, isExpanded, conversations]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (openConvoId) {
      fetchMessages(openConvoId);
      socketRef.current?.emit('join_room', openConvoId);
      // Clear unread for this convo
      setUnreadCounts((prev) => ({ ...prev, [openConvoId]: 0 }));
    }
  }, [openConvoId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !openConvoId) return;
    const sock = socketRef.current;
    if (!sock) return;

    playMessageSound('sent');

    // Optimistic update
    const optimistic: Message = {
      _id: `opt-${Date.now()}`,
      conversationId: openConvoId,
      senderUserId: user?.id || '',
      content: inputValue.trim(),
      seen: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    sock.emit('send_message', { conversationId: openConvoId, content: inputValue.trim() });
    sock.emit('typing_stop', openConvoId);
    setInputValue('');
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!openConvoId) return;
    const sock = socketRef.current;
    if (!sock) return;
    sock.emit('typing_start', openConvoId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sock.emit('typing_stop', openConvoId);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!token || !user || pathname === '/dashboard/messages') return null;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-3 flex items-start gap-3 max-w-[280px] animate-slideInRight"
            onClick={() => {
              setOpenConvoId(toast.conversationId);
              setIsExpanded(true);
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="w-8 h-8 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#00A453]">
                {getInitials(toast.senderName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{toast.senderName}</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{toast.content}</p>
            </div>
            <button
              className="shrink-0 text-gray-300 hover:text-gray-500 mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Floating Widget */}
      <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Expanded Panel */}
        {isExpanded && (
          <div
            className="bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ width: 340, height: openConvoId ? 480 : 340 }}
          >
            {/* Panel Header */}
            <div className="bg-[#00A453] px-4 py-3 flex items-center justify-between shrink-0">
              {openConvoId && openConvo ? (
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => {
                      setOpenConvoId(null);
                      socketRef.current?.emit('leave_room', openConvoId);
                    }}
                    className="text-white/80 hover:text-white mr-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {getInitials(openConvo.otherParty.name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {openConvo.otherParty.name}
                    </p>
                    {typingConvoIds.has(openConvoId) ? (
                      <p className="text-[10px] text-white/70">typing...</p>
                    ) : (
                      <p className="text-[10px] text-white/70 capitalize">
                        {openConvo.otherParty.role.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Messages</span>
                  {totalUnread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {totalUnread}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                {openConvoId && (
                  <button
                    onClick={() => router.push(`/dashboard/messages`)}
                    className="text-white/80 hover:text-white"
                    title="Open full page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                {!openConvoId && (
                  <button
                    onClick={() => router.push('/dashboard/messages')}
                    className="text-white/80 hover:text-white"
                    title="Open messages page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/80 hover:text-white"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {openConvoId && openConvo ? (
              /* Chat View */
              <>
                {openConvo.status === 'LOCKED' ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-xs text-gray-500">
                      This conversation is locked until the proposal is accepted.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 bg-[#f0f2f5] flex flex-col gap-1.5">
                      {loadingMsgs ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-5 h-5 border-2 border-[#00A453] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
                        </div>
                      ) : (
                        messages.map((msg, i) => {
                          const isMine = msg.senderUserId === user?.id;
                          const showTime =
                            i === messages.length - 1 ||
                            new Date(messages[i + 1]?.createdAt).getTime() -
                              new Date(msg.createdAt).getTime() >
                              5 * 60 * 1000;
                          return (
                            <div
                              key={msg._id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                  isMine
                                    ? 'bg-[#00A453] text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
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
                                    <span
                                      className={`${msg.seen ? 'text-[#00A453]' : 'text-gray-400'}`}
                                    >
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
                        })
                      )}
                      {typingConvoIds.has(openConvoId) && (
                        <div className="flex items-start">
                          <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 flex gap-1 items-center">
                            <span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#f0f2f5] rounded-full px-3 py-2 text-xs focus:outline-none focus:bg-gray-100 transition-colors"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="w-8 h-8 rounded-full bg-[#00A453] flex items-center justify-center disabled:opacity-40 hover:bg-[#008A45] transition-colors shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Conversation List */
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-2">
                    <MessageSquare className="w-8 h-8 text-gray-200" />
                    <p className="text-xs text-gray-400">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((convo) => {
                    const unread = unreadCounts[convo._id] || 0;
                    return (
                      <button
                        key={convo._id}
                        onClick={() => setOpenConvoId(convo._id)}
                        className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00A453]">
                              {getInitials(convo.otherParty.name)}
                            </span>
                          </div>
                          {convo.status === 'ACTIVE' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00A453] border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold text-gray-900 truncate ${unread > 0 ? 'text-[#00A453]' : ''}`}
                            >
                              {convo.otherParty.name}
                            </span>
                            {unread > 0 && (
                              <span className="bg-[#00A453] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shrink-0 ml-1">
                                {unread}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {convo.status === 'LOCKED' ? (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                            ) : (
                              convo.lastMessage || 'Start a conversation...'
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded((p) => !p)}
          className="w-14 h-14 rounded-full bg-[#00A453] shadow-lg hover:bg-[#008A45] transition-all flex items-center justify-center relative hover:scale-105 active:scale-95"
        >
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageSquareText className="w-6 h-6 text-white" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
}
