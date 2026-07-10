'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { Search, UserCheck, UserX, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: 'STUDENT' | 'TUTOR';
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'TUTOR'>('ALL');

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getUsers(token);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync platform users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    if (!token) return;
    try {
      const res = await adminApi.updateUserStatus(userId, !currentActive, token);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to moderate user account status.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (
      !confirm(
        'Are you absolutely sure you want to permanently delete this user? This will remove all their profiles and data.'
      )
    ) {
      return;
    }
    try {
      const res = await adminApi.deleteUser(userId, token);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete user account.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      u.phone.includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10B981] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Filter Role:
          </span>
          <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-black/25">
            {['ALL', 'STUDENT', 'TUTOR'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as any)}
                className={`h-8 px-3 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  roleFilter === r ? 'bg-[#10B981] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Profile</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verification Date</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No platform users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10">
                          {user.name?.substring(0, 1) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {user.name || 'Anonymous User'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                            {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-xs">{user.phone}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {user.email || 'No email attached'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          user.role === 'TUTOR'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#3B82F6]/15 text-[#3B82F6]'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                          user.isActive
                            ? 'bg-emerald-950/15 hover:bg-emerald-950/30 border-emerald-500/20 text-[#10B981]'
                            : 'bg-red-950/15 hover:bg-red-950/30 border-red-500/20 text-red-400'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Active / Live</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspended</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete User permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
