import { Request, Response } from 'express';
import { ContractService } from './contract.service.js';

export class ContractController {
  private service = new ContractService();

  // POST /api/v1/contracts — propose a new contract
  async createContract(req: Request, res: Response): Promise<void> {
    try {
      const creatorUserId = req.user?.id;
      if (!creatorUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const {
        partnerUserId,
        requirementId,
        bookingId,
        subject,
        billingType,
        agreedRate,
        classesPerWeek,
        scheduleNotes,
        terms,
        signerName,
      } = req.body;
      if (!partnerUserId || !agreedRate) {
        res
          .status(400)
          .json({ success: false, error: 'partnerUserId and agreedRate are required' });
        return;
      }

      const contract = await this.service.createContract(creatorUserId, {
        partnerUserId,
        requirementId,
        bookingId,
        subject: subject || 'Tuition Engagement',
        billingType: billingType || 'MONTHLY',
        agreedRate: Number(agreedRate),
        classesPerWeek: classesPerWeek ? Number(classesPerWeek) : 3,
        scheduleNotes,
        terms,
        signerName,
      });

      res.status(201).json({ success: true, data: contract });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res
        .status(status)
        .json({ success: false, error: error.message || 'Failed to create contract' });
    }
  }

  // POST /api/v1/contracts/:id/sign — digitally sign contract
  async signContract(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const contractId = req.params.id as string;
      const { signerName } = req.body;

      const contract = await this.service.signContract(contractId, userId, signerName || '');
      res.json({ success: true, data: contract });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res
        .status(status)
        .json({ success: false, error: error.message || 'Failed to sign contract' });
    }
  }

  // POST /api/v1/contracts/:id/terminate — give notice to end an active contract
  async terminateContract(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const contractId = req.params.id as string;
      const { reason } = req.body;

      const contract = await this.service.terminateContract(contractId, userId, reason);
      res.json({ success: true, data: contract });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res
        .status(status)
        .json({ success: false, error: error.message || 'Failed to terminate contract' });
    }
  }

  // GET /api/v1/contracts/:id — get contract details
  async getContract(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const contractId = req.params.id as string;
      const contract = await this.service.getContract(contractId, userId);
      res.json({ success: true, data: contract });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res
        .status(status)
        .json({ success: false, error: error.message || 'Failed to fetch contract' });
    }
  }

  // GET /api/v1/contracts — list all user contracts
  async getUserContracts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const contracts = await this.service.getUserContracts(userId);
      res.json({ success: true, data: contracts });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res
        .status(status)
        .json({ success: false, error: error.message || 'Failed to list contracts' });
    }
  }
}
