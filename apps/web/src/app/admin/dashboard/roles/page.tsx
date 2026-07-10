'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { ShieldCheck, Plus, CheckCircle, Save } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  _count?: { permissions: number; users: number };
}

interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string;
}

export default function AdminRolesPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]); // Array of permission IDs

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom role composing state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRolesData = async () => {
    if (!token) return;
    try {
      const [rolesRes, permRes] = await Promise.all([
        adminApi.getRoles(token),
        adminApi.getPermissions(token),
      ]);

      if (rolesRes.success) setRoles(rolesRes.data);
      if (permRes.success) setPermissions(permRes.data);

      if (rolesRes.data.length > 0) {
        handleSelectRole(rolesRes.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch RBAC configuration matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, [token]);

  const handleSelectRole = async (role: Role) => {
    if (!token) return;
    setSelectedRole(role);
    try {
      const res = await adminApi.getRolePermissions(role.id, token);
      if (res.success) {
        setRolePermissions(res.data.map((p: any) => p.id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch permissions assigned to this role.');
    }
  };

  const handlePermissionToggle = (permId: string) => {
    if (selectedRole?.name === 'Super Admin') return; // Cannot edit super admin
    setRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    if (!token || !selectedRole) return;
    setSubmitLoading(true);
    try {
      const res = await adminApi.updateRolePermissions(selectedRole.id, rolePermissions, token);
      if (res.success) {
        alert('Role permissions mapping updated successfully!');
        fetchRolesData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save role permissions mapping.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newRoleName) return;
    setSubmitLoading(true);

    try {
      const res = await adminApi.createRole({ name: newRoleName, description: newRoleDesc }, token);
      if (res.success) {
        setIsCreateOpen(false);
        setNewRoleName('');
        setNewRoleDesc('');
        fetchRolesData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize new workspace role.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Group permissions by module category
  const permissionsByModule = permissions.reduce(
    (acc, curr) => {
      if (!acc[curr.module]) acc[curr.module] = [];
      acc[curr.module].push(curr);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col min-h-0">
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Left Side: Roles List */}
        <div className="w-[300px] border border-white/5 rounded-xl bg-white/[0.01] overflow-y-auto shrink-0 flex flex-col justify-between">
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspace Roles
              </span>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="p-1.5 rounded hover:bg-white/5 text-[#10B981] cursor-pointer"
                title="Add new custom role"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full text-left p-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col ${
                  selectedRole?.id === role.id ? 'bg-white/[0.03] border-l-2 border-[#10B981]' : ''
                }`}
              >
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  {role.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  {role.description || 'No description provided'}
                </p>
                <div className="flex gap-4 mt-3 text-[10px] text-slate-500 font-semibold uppercase">
                  <span>{role._count?.permissions || 0} Perms</span>
                  <span>{role._count?.users || 0} Users</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Permissions Grid */}
        {selectedRole && (
          <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col overflow-hidden min-h-0">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Configure Permissions: <span className="text-[#10B981]">{selectedRole.name}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Role UUID: {selectedRole.id}</p>
              </div>

              {selectedRole.name !== 'Super Admin' && (
                <button
                  onClick={handleSavePermissions}
                  disabled={submitLoading}
                  className="h-9 px-4 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Matrix</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {selectedRole.name === 'Super Admin' && (
                <div className="p-4 rounded-lg bg-emerald-950/15 border border-emerald-500/10 text-[#10B981] text-xs leading-normal">
                  Super Admin permissions are locked to full system access and cannot be modified.
                </div>
              )}

              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5">
                    {module}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {perms.map((perm) => {
                      const isChecked =
                        rolePermissions.includes(perm.id) || selectedRole.name === 'Super Admin';
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          disabled={selectedRole.name === 'Super Admin'}
                          onClick={() => handlePermissionToggle(perm.id)}
                          className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                            isChecked
                              ? 'bg-[#10B981]/5 border-[#10B981]/25 text-[#10B981]'
                              : 'bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            disabled={selectedRole.name === 'Super Admin'}
                            className="mt-0.5 rounded border-white/10 text-[#10B981] focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white tracking-wide">
                              {perm.name}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                              {perm.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create custom role sheets Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[480px] rounded-xl border border-white/10 bg-[#121A2E] p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-6">
              Initialize Workspace Role
            </h3>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Role Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Moderator, Auditor, Support, etc..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Role Description
                </label>
                <textarea
                  placeholder="Describe operational responsibilities for this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-10 px-4 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="h-10 px-5 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitLoading ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
