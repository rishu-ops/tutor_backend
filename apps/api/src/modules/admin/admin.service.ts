/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  prisma,
  redis,
  hashPassword,
  comparePassword,
  TutorProfileModel,
  RequirementModel,
  ApplicationModel,
  ReportModel,
  NotificationModel,
} from 'database';
import config from '../../config/index.js';

export class AdminService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Helper: Write Audit Log
  async logAction(params: {
    adminId: string;
    action: string;
    module: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    try {
      const adminUser = await prisma.user.findUnique({
        where: { id: params.adminId },
        select: { name: true },
      });

      await prisma.auditLog.create({
        data: {
          adminId: params.adminId,
          adminName: adminUser?.name || 'Unknown Admin',
          action: params.action,
          module: params.module,
          resourceId: params.resourceId || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  // 1. AUTHENTICATION
  async login(credentials: any, meta: any) {
    const { email, password } = credentials;
    if (!email || !password) {
      const err = new Error('Email and password are required');
      (err as any).statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roleRef: true },
    });

    if (!user) {
      const err = new Error('Invalid email or password');
      (err as any).statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account has been suspended');
      (err as any).statusCode = 403;
      throw err;
    }

    if (user.role !== 'ADMIN') {
      const err = new Error('Access denied: Unauthorized role');
      (err as any).statusCode = 403;
      throw err;
    }

    if (!user.passwordHash || !comparePassword(password, user.passwordHash)) {
      const err = new Error('Invalid email or password');
      (err as any).statusCode = 401;
      throw err;
    }

    // Generate JWT and Session
    const tokens = await this.createNewSession(user.id, meta);

    // Audit log
    await this.logAction({
      adminId: user.id,
      action: 'Admin logged in',
      module: 'Authentication',
      ipAddress: meta?.ipAddress,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.roleRef?.name || 'Admin',
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string, meta: any) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { jti: string };
      const hash = this.hashToken(payload.jti);

      const session = await prisma.session.findUnique({
        where: { refreshTokenHash: hash },
        include: { user: true },
      });

      if (!session || session.revokedAt || new Date() > session.expiresAt) {
        const err = new Error('Invalid or expired refresh session');
        (err as any).statusCode = 401;
        throw err;
      }

      // Rotate session
      await prisma.session.update({
        where: { refreshTokenHash: hash },
        data: { revokedAt: new Date() },
      });

      const tokens = await this.createNewSession(session.userId, meta);
      return tokens;
    } catch (e: any) {
      const err = new Error(e.message || 'Invalid refresh token');
      (err as any).statusCode = 401;
      throw err;
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { jti: string };
      const hash = this.hashToken(payload.jti);

      await prisma.session.update({
        where: { refreshTokenHash: hash },
        data: { revokedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  private async createNewSession(userId: string, meta?: any) {
    const rawRefreshToken = crypto.randomUUID();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        deviceName: meta?.deviceName || null,
        ipAddress: meta?.ipAddress || null,
        userAgent: meta?.userAgent || null,
        expiresAt,
      },
    });

    const accessToken = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.accessTokenExpiry as any,
    });

    const refreshToken = jwt.sign({ jti: rawRefreshToken }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshTokenExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  // 2. ADMIN MANAGEMENT (Super Admin Only)
  async getAdmins() {
    return prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        roleRef: { select: { id: true, name: true, description: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(adminData: any, authorId: string, reqIp?: string) {
    const { name, phone, email, password, roleId } = adminData;
    if (!name || !phone || !email || !password || !roleId) {
      const err = new Error('Missing required admin fields');
      (err as any).statusCode = 422;
      throw err;
    }

    // Role check - only allow non-Super Admin creation unless explicitly authorized
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      const err = new Error('Role not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (role.name === 'Super Admin') {
      const err = new Error('Forbidden: Cannot create additional Super Admin users');
      (err as any).statusCode = 403;
      throw err;
    }

    const passwordHash = hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        role: 'ADMIN',
        roleId,
        isPhoneVerified: true,
      },
    });

    await this.logAction({
      adminId: authorId,
      action: `Created administrator user: ${admin.email}`,
      module: 'Admin Management',
      resourceId: admin.id,
      ipAddress: reqIp,
    });

    return admin;
  }

  async updateAdmin(id: string, updateData: any, authorId: string, reqIp?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roleRef: true },
    });

    if (!user || user.role !== 'ADMIN') {
      const err = new Error('Admin user not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Protect Super Admin from being altered
    if (user.roleRef?.name === 'Super Admin' && id !== authorId) {
      const err = new Error('Forbidden: Cannot modify another Super Admin account');
      (err as any).statusCode = 403;
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: updateData.name,
        phone: updateData.phone,
        email: updateData.email,
        isActive: updateData.isActive !== undefined ? !!updateData.isActive : undefined,
        roleId: updateData.roleId,
        passwordHash: updateData.password ? hashPassword(updateData.password) : undefined,
      },
    });

    await this.logAction({
      adminId: authorId,
      action: `Updated administrator configurations for: ${updated.email}`,
      module: 'Admin Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return updated;
  }

  async deleteAdmin(id: string, authorId: string, reqIp?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roleRef: true },
    });

    if (!user || user.role !== 'ADMIN') {
      const err = new Error('Admin user not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (user.roleRef?.name === 'Super Admin') {
      const err = new Error('Forbidden: Cannot delete Super Admin account');
      (err as any).statusCode = 403;
      throw err;
    }

    await prisma.user.delete({ where: { id } });

    await this.logAction({
      adminId: authorId,
      action: `Deleted admin user account: ${user.email}`,
      module: 'Admin Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return true;
  }

  // 3. ROLES & PERMISSIONS
  async getRoles() {
    return prisma.role.findMany({
      include: {
        _count: { select: { permissions: true, users: true } },
      },
    });
  }

  async createRole(name: string, description?: string) {
    return prisma.role.create({
      data: { name, description },
    });
  }

  async updateRole(id: string, name: string, description?: string) {
    return prisma.role.update({
      where: { id },
      data: { name, description },
    });
  }

  async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
  }

  async getRolePermissions(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    if (!role) {
      const err = new Error('Role not found');
      (err as any).statusCode = 404;
      throw err;
    }
    return role.permissions;
  }

  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
    authorId: string,
    reqIp?: string
  ) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      const err = new Error('Role not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Do not allow editing Super Admin permissions
    if (role.name === 'Super Admin') {
      const err = new Error('Forbidden: Super Admin permissions are fixed and cannot be changed');
      (err as any).statusCode = 403;
      throw err;
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
      },
    });

    await this.logAction({
      adminId: authorId,
      action: `Modified permissions set for role: ${role.name}`,
      module: 'Role Permissions Management',
      resourceId: roleId,
      ipAddress: reqIp,
    });

    return updated;
  }

  // 4. USERS MANAGEMENT
  async getUsers() {
    return prisma.user.findMany({
      where: { role: { in: ['STUDENT', 'TUTOR'] } },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserDetail(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    let profile = null;
    if (user.role === 'TUTOR') {
      profile = await TutorProfileModel.findOne({ userId: id });
    }

    return {
      ...user,
      profile,
    };
  }

  async updateUserStatus(id: string, isActive: boolean, authorId: string, reqIp?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    const action = isActive ? 'Restored user account' : 'Suspended user account';
    await this.logAction({
      adminId: authorId,
      action: `${action}: ${user.email || user.phone}`,
      module: 'User Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return updated;
  }

  async deleteUser(id: string, authorId: string, reqIp?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Delete corresponding profile
    if (user.role === 'TUTOR') {
      await TutorProfileModel.deleteOne({ userId: id });
    }

    await prisma.user.delete({ where: { id } });

    await this.logAction({
      adminId: authorId,
      action: `Permanently deleted user account: ${user.email || user.phone}`,
      module: 'User Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return true;
  }

  // 5. TUTOR VERIFICATION
  async getPendingVerifications() {
    return TutorProfileModel.find({ verificationStatus: 'PENDING' });
  }

  async approveVerification(profileId: string, authorId: string, reqIp?: string) {
    const profile = await TutorProfileModel.findById(profileId);
    if (!profile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    profile.verificationStatus = 'VERIFIED';
    await profile.save();

    await NotificationModel.create({
      userId: profile.userId,
      title: 'Tutor Verification Approved',
      content: 'Your tutor profile verification has been approved. You are now verified.',
    });

    await this.logAction({
      adminId: authorId,
      action: `Approved tutor verification for user ID: ${profile.userId}`,
      module: 'Tutor Verification',
      resourceId: profileId,
      ipAddress: reqIp,
    });

    return profile;
  }

  async rejectVerification(profileId: string, authorId: string, reqIp?: string) {
    const profile = await TutorProfileModel.findById(profileId);
    if (!profile) {
      const err = new Error('Tutor profile not found');
      (err as any).statusCode = 404;
      throw err;
    }

    profile.verificationStatus = 'REJECTED';
    await profile.save();

    await NotificationModel.create({
      userId: profile.userId,
      title: 'Tutor Verification Rejected',
      content:
        'Your tutor profile verification has been rejected. Please update your details and re-upload.',
    });

    await this.logAction({
      adminId: authorId,
      action: `Rejected tutor verification for user ID: ${profile.userId}`,
      module: 'Tutor Verification',
      resourceId: profileId,
      ipAddress: reqIp,
    });

    return profile;
  }

  // 6. REQUIREMENTS
  async getRequirements() {
    return RequirementModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  }

  async closeRequirement(id: string, authorId: string, reqIp?: string) {
    const req = await RequirementModel.findById(id);
    if (!req) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    req.status = 'CLOSED';
    await req.save();

    await this.logAction({
      adminId: authorId,
      action: `Force closed requirement: ${req.curriculum?.subject || req.category}`,
      module: 'Requirement Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return req;
  }

  async softDeleteRequirement(id: string, authorId: string, reqIp?: string) {
    const req = await RequirementModel.findById(id);
    if (!req) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    req.isDeleted = true;
    req.deletedAt = new Date();
    await req.save();

    await this.logAction({
      adminId: authorId,
      action: `Soft deleted requirement ID: ${id}`,
      module: 'Requirement Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return req;
  }

  async restoreRequirement(id: string, authorId: string, reqIp?: string) {
    const req = await RequirementModel.findById(id);
    if (!req) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    req.isDeleted = false;
    req.deletedAt = undefined;
    await req.save();

    await this.logAction({
      adminId: authorId,
      action: `Restored soft-deleted requirement ID: ${id}`,
      module: 'Requirement Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return req;
  }

  // 7. REPORTS
  async getReports() {
    return ReportModel.find().sort({ createdAt: -1 });
  }

  async createReport(reporterId: string, data: any) {
    const { targetType, targetId, reason, description } = data;
    if (!targetType || !targetId || !reason) {
      const err = new Error('Target type, ID, and reason are required');
      (err as any).statusCode = 422;
      throw err;
    }

    return ReportModel.create({
      reporterId,
      targetType,
      targetId,
      reason,
      description,
      status: 'PENDING',
    });
  }

  async resolveReport(id: string, data: any, authorId: string, reqIp?: string) {
    const { status, resolution } = data;
    if (!status || !['RESOLVED', 'IGNORED'].includes(status)) {
      const err = new Error('Invalid status. Must be RESOLVED or IGNORED');
      (err as any).statusCode = 422;
      throw err;
    }

    const report = await ReportModel.findById(id);
    if (!report) {
      const err = new Error('Report not found');
      (err as any).statusCode = 404;
      throw err;
    }

    report.status = status;
    report.resolution = resolution || '';
    report.resolvedById = authorId;
    await report.save();

    await this.logAction({
      adminId: authorId,
      action: `Resolved report ID ${id} with status ${status}`,
      module: 'Reports Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return report;
  }

  // 8. ADMIN POSTS / CMS
  async getPosts() {
    return prisma.adminPost.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublishedPosts() {
    return prisma.adminPost.findMany({
      where: { status: 'PUBLISHED' },
      include: { author: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async createPost(postData: any, authorId: string, reqIp?: string) {
    const { title, content, type, status } = postData;
    if (!title || !content || !type) {
      const err = new Error('Missing title, content, or type');
      (err as any).statusCode = 422;
      throw err;
    }

    const post = await prisma.adminPost.create({
      data: {
        title,
        content,
        type,
        status: status || 'DRAFT',
        authorId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await this.logAction({
      adminId: authorId,
      action: `Created admin post: ${title}`,
      module: 'Content Management',
      resourceId: post.id,
      ipAddress: reqIp,
    });

    return post;
  }

  async updatePost(id: string, updateData: any, authorId: string, reqIp?: string) {
    const post = await prisma.adminPost.findUnique({ where: { id } });
    if (!post) {
      const err = new Error('Post not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const isPublishing = updateData.status === 'PUBLISHED' && post.status !== 'PUBLISHED';

    const updated = await prisma.adminPost.update({
      where: { id },
      data: {
        title: updateData.title,
        content: updateData.content,
        type: updateData.type,
        status: updateData.status,
        publishedAt: isPublishing ? new Date() : undefined,
      },
    });

    await this.logAction({
      adminId: authorId,
      action: `Updated admin post: ${updated.title}`,
      module: 'Content Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return updated;
  }

  async deletePost(id: string, authorId: string, reqIp?: string) {
    const post = await prisma.adminPost.findUnique({ where: { id } });
    if (!post) {
      const err = new Error('Post not found');
      (err as any).statusCode = 404;
      throw err;
    }

    await prisma.adminPost.delete({ where: { id } });

    await this.logAction({
      adminId: authorId,
      action: `Deleted admin post: ${post.title}`,
      module: 'Content Management',
      resourceId: id,
      ipAddress: reqIp,
    });

    return true;
  }

  // 9. ANALYTICS
  async getOverview() {
    const totalUsers = await prisma.user.count({
      where: { role: { in: ['STUDENT', 'TUTOR'] } },
    });

    const students = await prisma.user.count({
      where: { role: 'STUDENT' },
    });

    const tutors = await prisma.user.count({
      where: { role: 'TUTOR' },
    });

    const activeTutors = await TutorProfileModel.countDocuments({
      verificationStatus: 'VERIFIED',
    });

    const pendingVerifications = await TutorProfileModel.countDocuments({
      verificationStatus: 'PENDING',
    });

    const requirements = await RequirementModel.countDocuments({
      isDeleted: { $ne: true },
    });

    const applications = await ApplicationModel.countDocuments();
    const reports = await ReportModel.countDocuments({ status: 'PENDING' });

    // Mock revenue metrics
    const revenue = 154800; // Mock revenue metric for MVP
    const bookings = 42; // Mock matched count or bookings count

    return {
      totalUsers,
      students,
      tutors,
      activeTutors,
      pendingVerifications,
      requirements,
      applications,
      reports,
      bookings,
      revenue,
    };
  }

  // 10. AUDIT LOGS
  async getAuditLogs() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Safety cap
    });
  }
}
