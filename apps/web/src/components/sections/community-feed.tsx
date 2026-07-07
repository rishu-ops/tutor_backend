'use client';

import { useState } from 'react';
import { MessageSquare, Users, Star, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Discussion {
  id: string;
  author: string;
  role: string;
  time: string;
  title: string;
  replies: number;
  likes: number;
  subject: string;
}

interface Board {
  id: string;
  name: string;
  description: string;
  members: string;
  category: string;
  joined?: boolean;
}

const initialDiscussions: Discussion[] = [
  {
    id: '1',
    author: 'Rohan M.',
    role: 'Class 12 Student',
    time: '2h ago',
    title:
      'How did you structure your studies for Class 12 Boards Math? Standard textbooks vs reference books?',
    replies: 34,
    likes: 12,
    subject: 'Mathematics',
  },
  {
    id: '2',
    author: 'Sunita Sharma',
    role: 'Parent',
    time: '5h ago',
    title:
      'Looking for recommendations for coding tutors for a 10-year old. Is Python too early to start?',
    replies: 18,
    likes: 8,
    subject: 'Programming',
  },
  {
    id: '3',
    author: 'Dr. Alok Verma',
    role: 'Physics Tutor (12+ yrs exp)',
    time: '1d ago',
    title:
      'Pro-tip: Focus heavily on dimensional analysis and free-body diagrams before solving high-level mechanics problems.',
    replies: 42,
    likes: 29,
    subject: 'Physics',
  },
  {
    id: '4',
    author: 'Neha Kapoor',
    role: 'JEE Aspirant',
    time: '2d ago',
    title:
      'Is it possible to crack JEE Mains relying solely on online lectures, or is a private home tutor necessary?',
    replies: 56,
    likes: 17,
    subject: 'Test Prep',
  },
];

const initialBoards: Board[] = [
  {
    id: 'b1',
    name: 'Mathematics & Calculus',
    description: 'Limits, integration, linear algebra, and board exam prep guidance.',
    members: '3.4K',
    category: 'Science',
  },
  {
    id: 'b2',
    name: 'Physics & Mechanics',
    description: 'Solving mechanics, thermodynamics, and electromagnetism doubts.',
    members: '2.8K',
    category: 'Science',
  },
  {
    id: 'b3',
    name: 'Coding & Python',
    description: 'Introductory scripting, web development, and algorithms for school students.',
    members: '4.1K',
    category: 'Technology',
  },
  {
    id: 'b4',
    name: 'Chemistry (Organic/Inorganic)',
    description: 'Reaction mechanisms, periodic tables, and molecular configurations.',
    members: '1.9K',
    category: 'Science',
  },
  {
    id: 'b5',
    name: 'English Lit & Boards Prep',
    description: 'Poetry analysis, essay writing techniques, and English grammar help.',
    members: '1.2K',
    category: 'Humanities',
  },
  {
    id: 'b6',
    name: 'JEE & NEET Mentorship',
    description: 'Tips, schedule strategy, mock test reviews, and stress management discussion.',
    members: '5.6K',
    category: 'Test Prep',
  },
];

export function CommunityFeed() {
  const [boards, setBoards] = useState<Board[]>(initialBoards);

  const toggleJoin = (id: string) => {
    setBoards(boards.map((b) => (b.id === id ? { ...b, joined: !b.joined } : b)));
  };

  return (
    <section className="bg-white py-16 border-b border-[#dadee2]">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Layout container: Left Column (Feed) and Right Column (Featured Boards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT COLUMN: Feed & Community Join box (4 cols) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Green Community Promo Box */}
            <div className="bg-[#e6f6ee] border border-[#00A453]/20 rounded-[12px] p-6">
              <h3 className="text-xl font-bold text-[#00060c] leading-snug">
                Join real talk with real students like you
              </h3>
              <p className="mt-2 text-sm text-[#384148] leading-relaxed">
                Connect with peers, ask questions, share mock scores, and get genuine advice from
                experienced tutors.
              </p>

              {/* Fake Avatar Stack */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#00A453] text-white flex items-center justify-center font-bold text-xs border border-white">
                    A
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#004fcb] text-white flex items-center justify-center font-bold text-xs border border-white">
                    S
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#384148] text-white flex items-center justify-center font-bold text-xs border border-white">
                    K
                  </div>
                </div>
                <span className="text-xs text-[#647380] font-semibold">12.4K students online</span>
              </div>
            </div>

            {/* Discussions Feed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#dadee2] pb-3">
                <h4 className="text-base font-bold text-[#00060c]">Recent Q&A & Advice</h4>
                <Badge variant="default">Live Feed</Badge>
              </div>

              <div className="space-y-5 divide-y divide-[#dadee2]">
                {initialDiscussions.map((post, idx) => (
                  <div key={post.id} className={idx > 0 ? 'pt-5' : ''}>
                    {/* Metadata header */}
                    <div className="flex items-center justify-between text-xs text-[#647380]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#00060c]">{post.author}</span>
                        <span>•</span>
                        <span>{post.role}</span>
                      </div>
                      <span>{post.time}</span>
                    </div>

                    {/* Question title */}
                    <h5 className="mt-2 text-sm font-semibold text-[#00060c] hover:text-[#00A453] cursor-pointer transition-colors leading-snug">
                      {post.title}
                    </h5>

                    {/* Stats footer */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[#647380]">
                      <span className="bg-[#f3f4f6] px-2 py-0.5 rounded-[4px] font-medium text-[#384148]">
                        {post.subject}
                      </span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.replies} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        <span>{post.likes} stars</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Featured Communities/Boards (7 cols) */}
          <div className="lg:col-span-7">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#00060c] tracking-tight">
                Get answers about subjects, boards, and exams
              </h3>
              <p className="text-sm text-[#647380] mt-1">
                Explore active boards, join discussions, or book sessions directly inside the
                subject.
              </p>
            </div>

            {/* Grid of Boards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white border border-[#dadee2] rounded-[8px] p-5 flex flex-col justify-between hover:border-[#647380]/40 transition-colors"
                >
                  <div>
                    {/* Header: Name & category */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#384148] leading-tight">
                        {board.name}
                      </h4>
                      <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                        {board.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#647380] mt-2 leading-relaxed">
                      {board.description}
                    </p>
                  </div>

                  {/* Actions & Member stats */}
                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#dadee2]">
                    <div className="flex items-center gap-1 text-[11px] text-[#647380] font-medium">
                      <Users className="w-3 h-3" />
                      <span>{board.members} members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2.5 rounded-[8px] flex items-center gap-0.5"
                      >
                        View <ArrowUpRight className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={board.joined ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => toggleJoin(board.id)}
                        className={`text-xs h-7 px-3 rounded-[8px] border transition-colors ${
                          board.joined
                            ? 'bg-[#e6f6ee] text-[#00A453] border-transparent hover:bg-[#d8eedf]'
                            : ''
                        }`}
                      >
                        {board.joined ? 'Joined' : 'Join'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
