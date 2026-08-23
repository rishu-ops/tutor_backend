import { Request, Response } from 'express';
import { PaymentService } from './payment.service.js';

export class PaymentController {
  private service = new PaymentService();

  // POST /api/v1/payments — log a payment due/made for a contract
  async createPaymentRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { contractId, amount, periodLabel, method } = req.body;
      if (!contractId || !amount || !periodLabel) {
        res.status(400).json({
          success: false,
          error: 'contractId, amount, and periodLabel are required',
        });
        return;
      }

      const payment = await this.service.createPaymentRecord(contractId, userId, {
        amount: Number(amount),
        periodLabel,
        method,
      });
      res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // POST /api/v1/payments/:id/mark-paid
  async markPaid(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const payment = await this.service.markPaid(req.params.id as string, userId);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // POST /api/v1/payments/:id/confirm
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const payment = await this.service.confirmPayment(req.params.id as string, userId);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // POST /api/v1/payments/:id/dispute
  async disputePayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { reason } = req.body;
      const payment = await this.service.disputePayment(req.params.id as string, userId, reason);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /api/v1/payments/contract/:contractId
  async getContractPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const payments = await this.service.getContractPayments(
        req.params.contractId as string,
        userId
      );
      res.json({ success: true, data: payments });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
