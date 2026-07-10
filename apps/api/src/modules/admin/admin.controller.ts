import { Request, Response } from 'express';
import { AdminService } from './admin.service.js';

export class AdminController {
  private service = new AdminService();

  // Helper for requests
  private getMeta(req: Request) {
    return {
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
      userAgent: req.headers['user-agent'],
      deviceName: req.headers['x-device-name']?.toString() || null,
    };
  }

  // 1. AUTHENTICATION
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.login(req.body, this.getMeta(req));
      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, error: 'Refresh token is required' });
        return;
      }
      const result = await this.service.refresh(refreshToken, this.getMeta(req));
      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await this.service.logout(refreshToken);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 2. ADMIN MANAGEMENT
  async getAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await this.service.getAdmins();
      res.json({ success: true, data: admins });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const admin = await this.service.createAdmin(req.body, authorId, req.ip);
      res.status(201).json({ success: true, data: admin });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const updated = await this.service.updateAdmin(
        req.params.id as string,
        req.body,
        authorId,
        req.ip
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      await this.service.deleteAdmin(req.params.id as string, authorId, req.ip);
      res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 3. ROLES & PERMISSIONS
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.service.getRoles();
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(422).json({ success: false, error: 'Role name is required' });
        return;
      }
      const role = await this.service.createRole(name, description);
      res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const role = await this.service.updateRole(req.params.id as string, name, description);
      res.json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const perms = await this.service.getPermissions();
      res.json({ success: true, data: perms });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const perms = await this.service.getRolePermissions(req.params.id as string);
      res.json({ success: true, data: perms });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { permissionIds } = req.body;
      if (!permissionIds || !Array.isArray(permissionIds)) {
        res.status(422).json({ success: false, error: 'permissionIds array is required' });
        return;
      }
      const role = await this.service.updateRolePermissions(
        req.params.id as string,
        permissionIds,
        authorId,
        req.ip
      );
      res.json({ success: true, data: role });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 4. USERS MANAGEMENT
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.service.getUsers();
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getUserDetail(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.service.getUserDetail(req.params.id as string);
      res.json({ success: true, data: user });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { isActive } = req.body;
      if (isActive === undefined) {
        res.status(422).json({ success: false, error: 'isActive boolean is required' });
        return;
      }
      const user = await this.service.updateUserStatus(
        req.params.id as string,
        !!isActive,
        authorId,
        req.ip
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      await this.service.deleteUser(req.params.id as string, authorId, req.ip);
      res.json({ success: true, message: 'User permanently deleted successfully' });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 5. TUTOR VERIFICATION
  async getPendingVerifications(req: Request, res: Response): Promise<void> {
    try {
      const profiles = await this.service.getPendingVerifications();
      res.json({ success: true, data: profiles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async approveVerification(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const profile = await this.service.approveVerification(
        req.params.id as string,
        authorId,
        req.ip
      );
      res.json({ success: true, data: profile });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async rejectVerification(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const profile = await this.service.rejectVerification(
        req.params.id as string,
        authorId,
        req.ip
      );
      res.json({ success: true, data: profile });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 6. REQUIREMENTS
  async getRequirements(req: Request, res: Response): Promise<void> {
    try {
      const requirements = await this.service.getRequirements();
      res.json({ success: true, data: requirements });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async closeRequirement(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const reqDoc = await this.service.closeRequirement(req.params.id as string, authorId, req.ip);
      res.json({ success: true, data: reqDoc });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async softDeleteRequirement(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const reqDoc = await this.service.softDeleteRequirement(
        req.params.id as string,
        authorId,
        req.ip
      );
      res.json({ success: true, data: reqDoc });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async restoreRequirement(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const reqDoc = await this.service.restoreRequirement(
        req.params.id as string,
        authorId,
        req.ip
      );
      res.json({ success: true, data: reqDoc });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 7. REPORTS
  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await this.service.getReports();
      res.json({ success: true, data: reports });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = req.user?.id;
      if (!reporterId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const report = await this.service.createReport(reporterId, req.body);
      res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async resolveReport(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const report = await this.service.resolveReport(
        req.params.id as string,
        req.body,
        authorId,
        req.ip
      );
      res.json({ success: true, data: report });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 8. ADMIN POSTS
  async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const posts = await this.service.getPosts();
      res.json({ success: true, data: posts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const post = await this.service.createPost(req.body, authorId, req.ip);
      res.status(201).json({ success: true, data: post });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const updated = await this.service.updatePost(
        req.params.id as string,
        req.body,
        authorId,
        req.ip
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.id;
      if (!authorId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      await this.service.deletePost(req.params.id as string, authorId, req.ip);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 9. ANALYTICS
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await this.service.getOverview();
      res.json({ success: true, data: overview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // 10. AUDIT LOGS
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await this.service.getAuditLogs();
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // PUBLIC POSTS
  async getPublicPosts(req: Request, res: Response): Promise<void> {
    try {
      const posts = await this.service.getPublishedPosts();
      res.json({ success: true, data: posts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
