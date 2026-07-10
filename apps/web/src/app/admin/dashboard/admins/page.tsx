'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { UserPlus, Edit3, Trash2, ShieldCheck, Mail, Phone, Lock, CheckCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  roleRef: { id: string; name: string } | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function AdminManagementPage() {
  const token = useAdminAuthStore((s) => s.accessToken);
  const currentAdmin = useAdminAuthStore((s) => s.admin);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Inputs state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [adminsRes, rolesRes] = await Promise.all([
        adminApi.getAdmins(token),
        adminApi.getRoles(token),
      ]);

      if (adminsRes.success) setAdmins(adminsRes.data);
      if (rolesRes.success) {
        // Exclude Super Admin from selection list
        setRoles(rolesRes.data.filter((r: any) => r.name !== 'Super Admin'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync administrators database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setRoleId(roles[0]?.id || '');
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setPhone(admin.phone);
    setEmail(admin.email);
    setPassword(''); // keep blank unless updating
    setRoleId(admin.roleRef?.id || '');
    setIsActive(admin.isActive);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !roleId) return;
    setSubmitLoading(true);

    try {
      let res;
      if (editingAdmin) {
        const payload: any = { name, phone, email, roleId, isActive };
        if (password) payload.password = password;
        res = await adminApi.updateAdmin(editingAdmin.id, payload, token);
      } else {
        res = await adminApi.createAdmin({ name, phone, email, password, roleId }, token);
      }

      if (res.success) {
        fetchData();
        setIsOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save administrator.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!token) return;
    if (adminId === currentAdmin?.id) {
      alert('Cannot delete your own administrative session.');
      return;
    }
    if (
      !confirm('Are you absolutely sure you want to permanently delete this administrator account?')
    ) {
      return;
    }

    try {
      const res = await adminApi.deleteAdmin(adminId, token);
      if (res.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete administrator account.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header action row */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          System Administrators
        </span>
        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-xs shadow-md shadow-[#10B981]/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Grid of Admins Table */}
      <div className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Administrator Name</th>
                <th className="p-4">Auth Details</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[#10B981] border border-white/10">
                        {admin.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{admin.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                          {admin.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{admin.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-white/5 text-slate-300 border border-white/5 uppercase">
                      {admin.roleRef?.name || 'Admin'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        admin.isActive
                          ? 'bg-emerald-950/15 text-[#10B981] border border-emerald-500/20'
                          : 'bg-red-950/15 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {admin.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {admin.roleRef?.name !== 'Super Admin' || admin.id === currentAdmin?.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {admin.roleRef?.name !== 'Super Admin' && (
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-1.5 rounded hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-sans italic">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[500px] rounded-xl border border-white/10 bg-[#121A2E] p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-6">
              {editingAdmin ? 'Edit Administrator Profile' : 'Register New Administrator'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@tutor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password {editingAdmin && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  placeholder={editingAdmin ? '••••••••••••' : 'Password hash credentials'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Workspace Role
                  </label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full h-11 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id} className="bg-[#121A2E]">
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingAdmin && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status Lock
                    </label>
                    <select
                      value={isActive ? 'true' : 'false'}
                      onChange={(e) => setIsActive(e.target.value === 'true')}
                      className="w-full h-11 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="true" className="bg-[#121A2E]">
                        ACTIVE
                      </option>
                      <option value="false" className="bg-[#121A2E]">
                        SUSPENDED
                      </option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-11 px-5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="h-11 px-6 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitLoading ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
