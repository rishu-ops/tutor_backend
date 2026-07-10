import { ConversationModel, prisma } from 'database';

export class ConversationService {
  /**
   * List all conversations (active or locked) for a student or tutor user
   */
  async getConversations(userId: string) {
    const conversations = await ConversationModel.find({
      $or: [{ studentUserId: userId }, { tutorUserId: userId }],
    }).sort({ updatedAt: -1 });

    const enriched = [];
    for (const convo of conversations) {
      // Find other user's name and details
      const otherUserId = convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { name: true, role: true },
      });

      enriched.push({
        ...convo.toObject(),
        otherParty: {
          id: otherUserId,
          name: otherUser?.name || 'Anonymous User',
          role: otherUser?.role || 'STUDENT',
        },
      });
    }

    return enriched;
  }

  /**
   * Get single conversation details by ID, validating ownership
   */
  async getConversation(id: string, userId: string) {
    const convo = await ConversationModel.findById(id);
    if (!convo) {
      const err = new Error('Conversation not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (convo.studentUserId !== userId && convo.tutorUserId !== userId) {
      const err = new Error('Forbidden: You do not have permission to view this conversation');
      (err as any).statusCode = 403;
      throw err;
    }

    const otherUserId = convo.studentUserId === userId ? convo.tutorUserId : convo.studentUserId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { name: true, role: true },
    });

    return {
      ...convo.toObject(),
      otherParty: {
        id: otherUserId,
        name: otherUser?.name || 'Anonymous User',
        role: otherUser?.role || 'STUDENT',
      },
    };
  }

  /**
   * Manually create/initialize a LOCKED conversation shell
   */
  async createConversation(
    studentUserId: string,
    tutorUserId: string,
    requirementId: string,
    applicationId: string
  ) {
    // Check if conversation already exists for this proposal
    const existing = await ConversationModel.findOne({ applicationId });
    if (existing) {
      return existing;
    }

    const convo = await ConversationModel.create({
      requirementId,
      studentUserId,
      tutorUserId,
      applicationId,
      status: 'LOCKED',
    });

    return convo;
  }
}
