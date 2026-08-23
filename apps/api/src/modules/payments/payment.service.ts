import { PaymentModel, ContractModel, NotificationModel, ReportModel, prisma } from 'database';

export class PaymentService {
  /**
   * Log a payment that's due or was made outside the platform (UPI, bank
   * transfer, cash). Either party to an active contract can create the record;
   * it starts PENDING until the payer marks it paid and the payee confirms.
   */
  async createPaymentRecord(
    contractId: string,
    creatorUserId: string,
    data: { amount: number; periodLabel: string; method?: string }
  ) {
    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Contract not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (contract.studentUserId !== creatorUserId && contract.tutorUserId !== creatorUserId) {
      const err = new Error('Forbidden: you are not a party to this contract');
      (err as any).statusCode = 403;
      throw err;
    }
    if (contract.status !== 'ACTIVE' && contract.status !== 'TERMINATING') {
      const err = new Error(`Cannot log a payment for a contract with status: ${contract.status}`);
      (err as any).statusCode = 400;
      throw err;
    }
    if (!data.amount || data.amount <= 0) {
      const err = new Error('amount must be a positive number');
      (err as any).statusCode = 400;
      throw err;
    }

    // The student pays the tutor — that's the only direction that makes sense here.
    const payerUserId = contract.studentUserId;
    const payeeUserId = contract.tutorUserId;

    const payment = await PaymentModel.create({
      contractId,
      bookingId: contract.bookingId,
      payerUserId,
      payeeUserId,
      amount: data.amount,
      periodLabel: data.periodLabel,
      method: data.method || '',
      status: 'PENDING',
    });

    const recipientId = creatorUserId === payerUserId ? payeeUserId : payerUserId;
    await NotificationModel.create({
      userId: recipientId,
      title: 'Payment Logged',
      content: `A payment of ₹${data.amount} for ${data.periodLabel} was logged for your tutoring agreement.`,
      type: 'PAYMENT_LOGGED',
      data: { paymentId: payment._id, contractId },
    }).catch(() => {});

    return payment;
  }

  /** The payer confirms they've sent the money (outside the platform). */
  async markPaid(paymentId: string, userId: string) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment record not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (payment.payerUserId !== userId) {
      const err = new Error('Only the payer can mark this payment as paid');
      (err as any).statusCode = 403;
      throw err;
    }
    if (payment.status !== 'PENDING') {
      const err = new Error(`Cannot mark paid a payment with status: ${payment.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    payment.status = 'MARKED_PAID';
    payment.markedPaidBy = userId;
    payment.markedPaidAt = new Date();
    await payment.save();

    await NotificationModel.create({
      userId: payment.payeeUserId,
      title: 'Payment Marked as Sent',
      content: `A payment of ₹${payment.amount} for ${payment.periodLabel} was marked as sent. Please confirm once you've received it.`,
      type: 'PAYMENT_MARKED_PAID',
      data: { paymentId: payment._id, contractId: payment.contractId },
    }).catch(() => {});

    return payment;
  }

  /** The payee confirms they actually received the money. */
  async confirmPayment(paymentId: string, userId: string) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment record not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (payment.payeeUserId !== userId) {
      const err = new Error('Only the payee can confirm this payment');
      (err as any).statusCode = 403;
      throw err;
    }
    if (payment.status !== 'MARKED_PAID') {
      const err = new Error(`Cannot confirm a payment with status: ${payment.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    payment.status = 'CONFIRMED';
    payment.confirmedBy = userId;
    payment.confirmedAt = new Date();
    await payment.save();

    await NotificationModel.create({
      userId: payment.payerUserId,
      title: 'Payment Confirmed',
      content: `Your payment of ₹${payment.amount} for ${payment.periodLabel} was confirmed as received.`,
      type: 'PAYMENT_CONFIRMED',
      data: { paymentId: payment._id, contractId: payment.contractId },
    }).catch(() => {});

    return payment;
  }

  /** Either party can dispute a payment that was marked paid but not actually received/sent correctly. */
  async disputePayment(paymentId: string, userId: string, reason?: string) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment record not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (payment.payerUserId !== userId && payment.payeeUserId !== userId) {
      const err = new Error('Forbidden: you are not a party to this payment');
      (err as any).statusCode = 403;
      throw err;
    }
    if (payment.status !== 'MARKED_PAID') {
      const err = new Error(`Cannot dispute a payment with status: ${payment.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    payment.status = 'DISPUTED';
    payment.disputedBy = userId;
    payment.disputedAt = new Date();
    payment.disputeReason = reason || '';
    await payment.save();

    const otherUserId = userId === payment.payerUserId ? payment.payeeUserId : payment.payerUserId;
    await NotificationModel.create({
      userId: otherUserId,
      title: 'Payment Disputed',
      content: `A payment of ₹${payment.amount} for ${payment.periodLabel} was disputed.${reason ? ` Reason: "${reason}"` : ''}`,
      type: 'PAYMENT_DISPUTED',
      data: { paymentId: payment._id, contractId: payment.contractId },
    }).catch(() => {});

    await ReportModel.create({
      reporterId: userId,
      targetType: 'CONTRACT',
      targetId: payment.contractId,
      reason: 'PAYMENT_DISPUTE',
      description: reason || `Payment of ₹${payment.amount} for ${payment.periodLabel} disputed.`,
      status: 'PENDING',
    }).catch(() => {});

    return payment;
  }

  async getContractPayments(contractId: string, userId: string) {
    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Contract not found');
      (err as any).statusCode = 404;
      throw err;
    }
    if (contract.studentUserId !== userId && contract.tutorUserId !== userId) {
      const err = new Error('Forbidden: you are not a party to this contract');
      (err as any).statusCode = 403;
      throw err;
    }

    const payments = await PaymentModel.find({ contractId }).sort({ createdAt: -1 });
    const otherUserId =
      contract.studentUserId === userId ? contract.tutorUserId : contract.studentUserId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { name: true },
    });

    return payments.map((p) => ({ ...p.toObject(), otherPartyName: otherUser?.name || 'Party' }));
  }
}
