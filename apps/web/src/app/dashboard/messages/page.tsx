'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Lock, MessageSquare, Shield, Clock, Send, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessagesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      } else {
        setError(data.error || 'Failed to load messages.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed. Displaying demo chats.');
      // Inject demo conversations for local testing fallback
      setConversations([
        {
          _id: 'convo-demo-1',
          status: 'LOCKED',
          otherParty: { name: 'Dr. Rahul Sharma', role: 'TUTOR' },
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'convo-demo-2',
          status: 'ACTIVE',
          otherParty: { name: 'Amit Verma', role: 'TUTOR' },
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] bg-white border border-[#dadee2] rounded-3xl overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className="w-80 border-r border-[#dadee2] flex flex-col bg-[#FAFAFA] shrink-0">
        <div className="p-4 border-b border-[#dadee2]">
          <h2 className="text-md font-extrabold text-[#2d2d2d] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00A453]" /> Conversations
          </h2>
          <p className="text-[10px] text-[#647380] mt-1">
            Accept proposals to activate conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
          {loading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-2 text-xs text-[#647380]">
              <div className="animate-spin w-4 h-4 border-2 border-[#00A453] border-t-transparent rounded-full" />
              Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[#647380] mt-12 gap-3">
              <Compass className="w-8 h-8 text-gray-300" />
              <span>No conversations initiated yet.</span>
            </div>
          ) : (
            conversations.map((convo) => {
              const isSelected = selectedConvo?._id === convo._id;
              return (
                <button
                  key={convo._id}
                  onClick={() => setSelectedConvo(convo)}
                  className={`w-full p-3.5 rounded-2xl text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-white shadow-sm border border-[#dadee2] scale-[1.01]'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-[#e6f6ee] border border-[#00A453]/25 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#00A453]">
                      {getInitials(convo.otherParty.name)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#2d2d2d] truncate block">
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
                    <span className="text-[10px] text-[#647380] capitalize mt-0.5 block">
                      {convo.otherParty.role.toLowerCase()}
                    </span>
                    <span className="text-[9px] text-[#b0b8c1] block mt-1">
                      {new Date(convo.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConvo ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header info */}
            <div className="p-4 border-b border-[#dadee2] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#e6f6ee] border border-[#00A453]/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#00A453]">
                    {getInitials(selectedConvo.otherParty.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2d2d2d]">
                    {selectedConvo.otherParty.name}
                  </h3>
                  <span className="text-[10px] text-[#647380] capitalize">
                    {selectedConvo.otherParty.role.toLowerCase()}
                  </span>
                </div>
              </div>

              {selectedConvo.status === 'LOCKED' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  <Lock className="w-3.5 h-3.5" /> Locked State
                </div>
              )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gray-50/50">
              {selectedConvo.status === 'LOCKED' ? (
                <div className="max-w-md w-full bg-white border border-[#dadee2] rounded-3xl p-8 text-center shadow-sm space-y-4">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-extrabold text-[#2d2d2d]">Conversation Locked</h4>
                    <p className="text-xs text-[#647380] leading-relaxed">
                      This chat shell has been registered. Tutors and students cannot exchange
                      messages until the student **Accepts** the tutor's proposal.
                    </p>
                  </div>
                  <div className="bg-[#FAFAFA] border border-[#dadee2] rounded-2xl p-4 flex gap-3 text-left">
                    <Shield className="w-5 h-5 text-[#00A453] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-extrabold text-[#2d2d2d] block">
                        Safety & Booking Checks
                      </span>
                      <span className="text-[10px] text-[#647380] block mt-0.5 leading-normal">
                        We lock conversations during evaluation to prevent off-platform hires,
                        keeping students protected under the Tutor hiring policy.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#2d2d2d]">Conversation Active</h4>
                    <p className="text-xs text-[#647380] mt-1">
                      You are now ready to chat and negotiate schedules.
                    </p>
                  </div>
                  <div className="text-[10px] text-[#b0b8c1] italic">
                    Real-time messaging backend channels will be implemented in Phase 6.
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-[#dadee2] bg-white flex gap-2">
              <input
                type="text"
                disabled={selectedConvo.status === 'LOCKED'}
                placeholder={
                  selectedConvo.status === 'LOCKED'
                    ? 'Accept this proposal to unlock chat...'
                    : 'Type a message...'
                }
                className="flex-1 bg-gray-50 border border-[#dadee2] rounded-xl px-4 text-xs focus:outline-none focus:border-[#00A453] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <Button
                disabled={selectedConvo.status === 'LOCKED'}
                className="bg-[#00A453] hover:bg-[#008A45] text-white px-4 rounded-xl flex items-center gap-1.5 text-xs h-10 font-bold shrink-0 disabled:opacity-50"
              >
                Send <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-300 animate-pulse" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2d2d2d]">Select a Conversation</h3>
              <p className="text-xs text-[#647380] mt-1 max-w-xs">
                Pick a tutor or student conversation from the sidebar list to see details and
                status.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
