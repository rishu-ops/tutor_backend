/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationModel,
  RequirementModel,
  TutorProfileModel,
  NotificationModel,
  prisma,
} from 'database';

export class ApplicationService {
  /**
   * Tutor applies to a student requirement with a proposal
   */
  async apply(tutorUserId: string, requirementId: string, proposal: any) {
    const requirement = await RequirementModel.findById(requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Business Rules checks:
    // 1. Cannot apply to own requirement
    if (requirement.studentUserId === tutorUserId) {
      const err = new Error('Forbidden: Tutors cannot apply to their own requirement');
      (err as any).statusCode = 403;
      throw err;
    }

    // 2. Can only apply to OPEN requirements
    if (requirement.status !== 'OPEN') {
      const err = new Error('Bad Request: Applications are closed for this requirement');
      (err as any).statusCode = 400;
      throw err;
    }

    // 3. Prevent duplicate applications
    const existingApp = await ApplicationModel.findOne({ requirementId, tutorUserId });
    if (existingApp) {
      const err = new Error('Conflict: You have already applied to this requirement');
      (err as any).statusCode = 409;
      throw err;
    }

    // 4. Max 5 applications limit
    if (requirement.applicationsCount >= 5) {
      const err = new Error('Bad Request: Maximum applications limit (5) reached');
      (err as any).statusCode = 400;
      throw err;
    }

    // Create the proposal application
    const application = await ApplicationModel.create({
      requirementId,
      tutorUserId,
      studentUserId: requirement.studentUserId,
      introduction: proposal.introduction.trim(),
      proposedFee: Number(proposal.proposedFee),
      availableTimings: proposal.availableTimings.trim(),
      freeDemo: !!proposal.freeDemo,
      message: proposal.message.trim(),
      status: 'SENT',
    });

    // Increment applications count
    const updatedCount = requirement.applicationsCount + 1;
    requirement.applicationsCount = updatedCount;

    // Transition to IN_REVIEW if applications limit reached (5)
    if (updatedCount >= 5) {
      requirement.status = 'IN_REVIEW';
    }
    await requirement.save();

    // Create Student notification
    const subjectName = requirement.curriculum?.subject || requirement.category;
    await NotificationModel.create({
      userId: requirement.studentUserId,
      title: 'New Tutor Applied',
      content: `A tutor has applied to your requirement for ${subjectName}.`,
    });

    return application;
  }

  /**
   * Get applications submitted by logged-in tutor
   */
  async getTutorApplications(tutorUserId: string) {
    const applications = await ApplicationModel.find({ tutorUserId }).sort({ createdAt: -1 });
    const enriched = [];

    for (const app of applications) {
      const req = await RequirementModel.findById(app.requirementId);
      enriched.push({
        ...app.toObject(),
        requirement: req
          ? {
              subject: req.curriculum?.subject || req.category,
              level: req.curriculum?.level || '',
              budget: req.budget,
              location: req.location,
              status: req.status,
            }
          : null,
      });
    }

    return enriched;
  }

  /**
   * Get list of applications for a student's requirement
   */
  async getRequirementApplications(studentUserId: string, requirementId: string) {
    const requirement = await RequirementModel.findById(requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (requirement.studentUserId !== studentUserId) {
      const err = new Error('Forbidden: You do not own this requirement');
      (err as any).statusCode = 403;
      throw err;
    }

    const applications = await ApplicationModel.find({ requirementId }).sort({ createdAt: -1 });
    const enriched = [];

    for (const app of applications) {
      // Transition status to VIEWED if it was SENT
      if (app.status === 'SENT') {
        app.status = 'VIEWED';
        await app.save();

        // Dispatch notification to tutor
        const subjectName = requirement.curriculum?.subject || requirement.category;
        await NotificationModel.create({
          userId: app.tutorUserId,
          title: 'Application Viewed',
          content: `The student viewed your proposal for ${subjectName}.`,
        });
      }

      // Load tutor info
      const tutorUser = await prisma.user.findUnique({
        where: { id: app.tutorUserId },
        select: { name: true, phone: true, email: true },
      });

      const tutorProfile = await TutorProfileModel.findOne({ userId: app.tutorUserId });

      enriched.push({
        ...app.toObject(),
        tutor: {
          name: tutorUser?.name || 'Anonymous Tutor',
          phone: tutorUser?.phone,
          email: tutorUser?.email,
          bio: tutorProfile?.bio || '',
          qualifications: tutorProfile?.qualifications || [],
          subjects: tutorProfile?.subjects || [],
          availability: tutorProfile?.availability || [],
          ratingAvg: tutorProfile?.ratingAvg || 5.0,
        },
      });
    }

    return enriched;
  }

  /**
   * Accept an application, reject others, transition requirement status to MATCHED
   */
  async acceptApplication(studentUserId: string, applicationId: string) {
    const application = await ApplicationModel.findById(applicationId);
    if (!application) {
      const err = new Error('Application not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const requirement = await RequirementModel.findById(application.requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (requirement.studentUserId !== studentUserId) {
      const err = new Error('Forbidden: You do not own this requirement');
      (err as any).statusCode = 403;
      throw err;
    }

    if (requirement.status === 'MATCHED' || requirement.status === 'CLOSED') {
      const err = new Error('Bad Request: Requirement is already matched or closed');
      (err as any).statusCode = 400;
      throw err;
    }

    // 1. Accept this application
    application.status = 'ACCEPTED';
    await application.save();

    // 2. Reject all other pending applications for this requirement
    const otherApps = await ApplicationModel.find({
      requirementId: requirement._id,
      _id: { $ne: applicationId },
      status: { $in: ['SENT', 'VIEWED', 'SHORTLISTED'] },
    });

    for (const otherApp of otherApps) {
      otherApp.status = 'REJECTED';
      await otherApp.save();

      // Notify other tutors
      const subjectName = requirement.curriculum?.subject || requirement.category;
      await NotificationModel.create({
        userId: otherApp.tutorUserId,
        title: 'Application Closed',
        content: `The proposal for ${subjectName} was closed as the student accepted another tutor.`,
      });
    }

    // 3. Update requirement status
    requirement.status = 'MATCHED';
    await requirement.save();

    // 4. Notify accepted tutor
    const subjectName = requirement.curriculum?.subject || requirement.category;
    await NotificationModel.create({
      userId: application.tutorUserId,
      title: 'Application Accepted',
      content: `Congratulations! Your proposal for ${subjectName} has been accepted.`,
    });

    return application;
  }

  /**
   * Reject a tutor's proposal
   */
  async rejectApplication(studentUserId: string, applicationId: string) {
    const application = await ApplicationModel.findById(applicationId);
    if (!application) {
      const err = new Error('Application not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const requirement = await RequirementModel.findById(application.requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (requirement.studentUserId !== studentUserId) {
      const err = new Error('Forbidden: You do not own this requirement');
      (err as any).statusCode = 403;
      throw err;
    }

    application.status = 'REJECTED';
    await application.save();

    // Notify tutor
    const subjectName = requirement.curriculum?.subject || requirement.category;
    await NotificationModel.create({
      userId: application.tutorUserId,
      title: 'Application Rejected',
      content: `Your proposal for ${subjectName} was not selected.`,
    });

    return application;
  }

  /**
   * Get single application details, validating ownership (either tutor or student)
   */
  async getApplicationDetails(userId: string, applicationId: string) {
    const application = await ApplicationModel.findById(applicationId);
    if (!application) {
      const err = new Error('Application not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (application.tutorUserId !== userId && application.studentUserId !== userId) {
      const err = new Error('Forbidden: You do not own or receive this application');
      (err as any).statusCode = 403;
      throw err;
    }

    // Load tutor details
    const tutorUser = await prisma.user.findUnique({
      where: { id: application.tutorUserId },
      select: { name: true, phone: true, email: true },
    });

    const tutorProfile = await TutorProfileModel.findOne({ userId: application.tutorUserId });

    return {
      ...application.toObject(),
      tutor: {
        name: tutorUser?.name || 'Anonymous Tutor',
        phone: tutorUser?.phone,
        email: tutorUser?.email,
        bio: tutorProfile?.bio || '',
        qualifications: tutorProfile?.qualifications || [],
        subjects: tutorProfile?.subjects || [],
        availability: tutorProfile?.availability || [],
        ratingAvg: tutorProfile?.ratingAvg || 5.0,
      },
    };
  }

  /**
   * Explicitly mark application as VIEWED
   */
  async markApplicationAsViewed(studentUserId: string, applicationId: string) {
    const application = await ApplicationModel.findById(applicationId);
    if (!application) {
      const err = new Error('Application not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (application.studentUserId !== studentUserId) {
      const err = new Error('Forbidden: You do not own this requirement');
      (err as any).statusCode = 403;
      throw err;
    }

    if (application.status === 'SENT') {
      application.status = 'VIEWED';
      await application.save();

      const requirement = await RequirementModel.findById(application.requirementId);
      const subjectName =
        requirement?.curriculum?.subject || requirement?.category || 'your tutoring post';
      await NotificationModel.create({
        userId: application.tutorUserId,
        title: 'Application Viewed',
        content: `The student viewed your proposal for ${subjectName}.`,
      });
    }

    return application;
  }

  /**
   * Compare multiple tutor applications side-by-side
   */
  async compareApplications(studentUserId: string, applicationIds: string[]) {
    const enriched = [];

    for (const appId of applicationIds) {
      const app = await ApplicationModel.findById(appId);
      if (!app) continue;

      if (app.studentUserId !== studentUserId) {
        const err = new Error('Forbidden: You do not own one of the selected requirements');
        (err as any).statusCode = 403;
        throw err;
      }

      // Load tutor info
      const tutorUser = await prisma.user.findUnique({
        where: { id: app.tutorUserId },
        select: { name: true },
      });

      const tutorProfile = await TutorProfileModel.findOne({ userId: app.tutorUserId });

      // Determine years of experience
      // Let's sum years from experience blocks or default to a reasonable value
      let experienceYrs = 1;
      if (tutorProfile?.experience && Array.isArray(tutorProfile.experience)) {
        experienceYrs =
          tutorProfile.experience.reduce((acc: number, val: any) => {
            const yrs = Number(val.yearsOfExperience) || 0;
            return acc + yrs;
          }, 0) || 1;
      }

      enriched.push({
        applicationId: app._id,
        tutorUserId: app.tutorUserId,
        tutorName: tutorUser?.name || 'Anonymous Tutor',
        rating: tutorProfile?.ratingAvg || 5.0,
        proposedFee: app.proposedFee,
        freeDemo: app.freeDemo,
        verified: true, // Mock verification badge status
        experience: `${experienceYrs} yrs`,
        timings: app.availableTimings,
      });
    }

    return enriched;
  }
}
