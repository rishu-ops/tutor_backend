import {
  ContractModel,
  ConversationModel,
  MessageModel,
  NotificationModel,
  RequirementModel,
  prisma,
} from 'database';
import { getIO } from '../../socket/socket.gateway.js';

export class ContractService {
  /**
   * Create a new tutoring contract proposal
   */
  async createContract(
    creatorUserId: string,
    data: {
      partnerUserId: string;
      requirementId?: string;
      bookingId?: string;
      subject: string;
      billingType: 'HOURLY' | 'MONTHLY';
      agreedRate: number;
      classesPerWeek?: number;
      scheduleNotes?: string;
      terms?: string[];
      signerName?: string;
    }
  ) {
    const creatorUser = await prisma.user.findUnique({ where: { id: creatorUserId } });
    if (!creatorUser) {
      const err = new Error('Creator user not found');
      (err as any).statusCode = 404;
      throw err;
    }

    let studentUserId = '';
    let tutorUserId = '';

    if (creatorUser.role === 'TUTOR') {
      tutorUserId = creatorUserId;
      studentUserId = data.partnerUserId;
    } else {
      studentUserId = creatorUserId;
      tutorUserId = data.partnerUserId;
    }

    const defaultTerms = [
      'Both student and tutor agree to conduct sessions professionally and on time.',
      'Tutoring fee will be paid per agreed billing frequency via findmyTutor platform guarantee.',
      'Sessions can be rescheduled with at least 12 hours advance notice.',
      'Either party can terminate this agreement with 7 days written notice.',
    ];

    const isCreatorStudent = creatorUser.role === 'STUDENT';
    const isCreatorTutor = creatorUser.role === 'TUTOR';

    const contract = await ContractModel.create({
      requirementId: data.requirementId,
      bookingId: data.bookingId,
      studentUserId,
      tutorUserId,
      subject: data.subject || 'Tuition Engagement',
      billingType: data.billingType || 'MONTHLY',
      agreedRate: data.agreedRate,
      classesPerWeek: data.classesPerWeek || 3,
      scheduleNotes: data.scheduleNotes || '',
      terms: data.terms?.length ? data.terms : defaultTerms,
      studentSignature: {
        signed: isCreatorStudent,
        signedAt: isCreatorStudent ? new Date() : undefined,
        signerName: isCreatorStudent ? data.signerName || creatorUser.name || 'Student' : undefined,
      },
      tutorSignature: {
        signed: isCreatorTutor,
        signedAt: isCreatorTutor ? new Date() : undefined,
        signerName: isCreatorTutor ? data.signerName || creatorUser.name || 'Tutor' : undefined,
      },
      status: 'PENDING_SIGNATURES',
    });

    // Notify partner user & post interactive contract proposal card to chat
    try {
      const recipientId = isCreatorTutor ? studentUserId : tutorUserId;
      const creatorName = creatorUser.name || (isCreatorTutor ? 'Your tutor' : 'Your student');

      await NotificationModel.create({
        userId: recipientId,
        title: `Tutoring Contract Proposed 📜`,
        content: `${creatorName} has proposed an official tutoring agreement for ${contract.subject} at ₹${contract.agreedRate}/${contract.billingType.toLowerCase()}. Please review and sign it.`,
        type: 'CONTRACT_PROPOSED',
        data: { contractId: contract._id, requirementId: data.requirementId },
      });

      // Find or create active conversation shell
      let convo = await ConversationModel.findOne({
        $or: [
          { studentUserId, tutorUserId },
          { studentUserId: tutorUserId, tutorUserId: studentUserId },
        ],
      });

      if (!convo) {
        convo = await ConversationModel.create({
          studentUserId,
          tutorUserId,
          requirementId: data.requirementId || 'contract-init',
          applicationId: 'contract-' + Date.now(),
          status: 'ACTIVE',
        });
      } else if (convo.status === 'LOCKED') {
        convo.status = 'ACTIVE';
        await convo.save();
      }

      const msgContent = `📜 CONTRACT_PROPOSAL:${contract._id}:${contract.subject}:${contract.billingType}:${contract.agreedRate}:${contract.classesPerWeek}:${data.scheduleNotes || ''}`;

      const chatMessage = await MessageModel.create({
        conversationId: convo._id,
        senderUserId: creatorUserId,
        content: msgContent,
        seen: false,
      });

      convo.lastMessage = `📜 Proposed Tutoring Contract for ${contract.subject}`;
      convo.lastMessageAt = new Date();
      await convo.save();

      const io = getIO();
      if (io) {
        const msgObj = chatMessage.toObject();
        io.to(`room:${convo._id}`).emit('new_message', msgObj);
        io.to(`user:${studentUserId}`).emit('message_notification', msgObj);
        io.to(`user:${tutorUserId}`).emit('message_notification', msgObj);
      }
    } catch (err) {
      console.error('Failed to dispatch contract notification/message:', err);
    }

    return contract;
  }

  /**
   * Digitally sign an existing contract
   */
  async signContract(contractId: string, userId: string, signerName: string) {
    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Contract not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (contract.studentUserId !== userId && contract.tutorUserId !== userId) {
      const err = new Error('Forbidden: You are not a party to this contract');
      (err as any).statusCode = 403;
      throw err;
    }

    const isStudent = contract.studentUserId === userId;
    const isTutor = contract.tutorUserId === userId;

    if (isStudent) {
      contract.studentSignature = {
        signed: true,
        signedAt: new Date(),
        signerName: signerName.trim() || 'Student',
      };
    }
    if (isTutor) {
      contract.tutorSignature = {
        signed: true,
        signedAt: new Date(),
        signerName: signerName.trim() || 'Tutor',
      };
    }

    // Check if both parties have signed
    if (contract.studentSignature?.signed && contract.tutorSignature?.signed) {
      contract.status = 'ACTIVE';
    }

    await contract.save();

    // Dispatch chat notification & status update
    try {
      const otherUserId = isStudent ? contract.tutorUserId : contract.studentUserId;
      const signerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const convo = await ConversationModel.findOne({
        $or: [
          { studentUserId: contract.studentUserId, tutorUserId: contract.tutorUserId },
          { studentUserId: contract.tutorUserId, tutorUserId: contract.studentUserId },
        ],
      });

      if (convo) {
        const isFullySigned = contract.status === 'ACTIVE';
        const msgContent = `STATUS_UPDATE:${contract._id}:${isFullySigned ? 'CONTRACT_ACTIVE' : 'CONTRACT_SIGNED'}:${isFullySigned ? `✓ Tutoring Agreement FULLY SIGNED & ACTIVE for ${contract.subject}!` : `✍ ${signerName || signerUser?.name || 'A party'} digitally signed the Tutoring Agreement`}`;

        const chatMessage = await MessageModel.create({
          conversationId: convo._id,
          senderUserId: userId,
          content: msgContent,
          seen: false,
        });

        convo.lastMessage = isFullySigned
          ? `✓ Agreement Signed & Active (${contract.subject})`
          : `✍ Signed contract by ${signerName}`;
        convo.lastMessageAt = new Date();
        await convo.save();

        const io = getIO();
        if (io) {
          const msgObj = chatMessage.toObject();
          io.to(`room:${convo._id}`).emit('new_message', msgObj);
          io.to(`user:${contract.studentUserId}`).emit('message_notification', msgObj);
          io.to(`user:${contract.tutorUserId}`).emit('message_notification', msgObj);
        }
      }

      await NotificationModel.create({
        userId: otherUserId,
        title: contract.status === 'ACTIVE' ? 'Agreement Fully Signed! 🎉' : 'Contract Signed ✍',
        content: `${signerName || signerUser?.name || 'Party'} has signed the tutoring agreement for ${contract.subject}.${contract.status === 'ACTIVE' ? ' Your engagement is now active!' : ''}`,
        type: 'CONTRACT_SIGNED',
        data: { contractId: contract._id },
      });
    } catch (err) {
      console.error('Failed to notify contract signature:', err);
    }

    return contract;
  }

  /**
   * Get single contract details
   */
  async getContract(contractId: string, userId: string) {
    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      const err = new Error('Contract not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (contract.studentUserId !== userId && contract.tutorUserId !== userId) {
      const err = new Error('Forbidden: Access denied');
      (err as any).statusCode = 403;
      throw err;
    }

    const otherUserId = contract.studentUserId === userId ? contract.tutorUserId : contract.studentUserId;
    const [studentUser, tutorUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: contract.studentUserId }, select: { name: true, email: true, phone: true } }),
      prisma.user.findUnique({ where: { id: contract.tutorUserId }, select: { name: true, email: true, phone: true } }),
    ]);

    return {
      ...contract.toObject(),
      studentParty: { id: contract.studentUserId, name: studentUser?.name || 'Student', email: studentUser?.email, phone: studentUser?.phone },
      tutorParty: { id: contract.tutorUserId, name: tutorUser?.name || 'Tutor', email: tutorUser?.email, phone: tutorUser?.phone },
    };
  }

  /**
   * Get all contracts for user
   */
  async getUserContracts(userId: string) {
    const contracts = await ContractModel.find({
      $or: [{ studentUserId: userId }, { tutorUserId: userId }],
    }).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      contracts.map(async (c) => {
        const otherUserId = c.studentUserId === userId ? c.tutorUserId : c.studentUserId;
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { name: true, role: true },
        });
        return {
          ...c.toObject(),
          otherParty: {
            id: otherUserId,
            name: otherUser?.name || 'Party',
            role: otherUser?.role || 'USER',
          },
        };
      })
    );

    return enriched;
  }
}
