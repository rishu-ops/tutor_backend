/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequirementRepository } from './requirement.repository.js';
import { prisma, TutorProfileModel } from 'database';
import { notificationQueue } from '../notifications/notification.queue.js';

// The requirement-creation form submits raw checkbox labels, while TutorProfile.teachingModes
// stores the normalized 'ONLINE' | 'OFFLINE' | 'HYBRID' codes (see tutor onboarding mapping).
// Without normalizing here, Requirement.teachingMode and TutorProfile.teachingModes never share
// a single common value, so every mode-based match/filter between them silently returns nothing.
const TEACHING_MODE_MAP: Record<string, string> = {
  'Home Tuition': 'OFFLINE',
  Online: 'ONLINE',
  'Group Classes': 'HYBRID',
  'Coaching Center': 'HYBRID',
};

function normalizeTeachingModes(modes: unknown): string[] | undefined {
  if (!Array.isArray(modes)) return undefined;
  const normalized = modes.map((m) => TEACHING_MODE_MAP[m] || m);
  return Array.from(new Set(normalized));
}

// Equivalence classes covering both the legacy raw-label values already saved on older
// Requirement documents and the normalized codes new ones are written with, so matching/
// filtering works across both without needing a one-time data migration.
const TEACHING_MODE_CLASSES: Record<string, string[]> = {
  OFFLINE: ['OFFLINE', 'Home Tuition'],
  ONLINE: ['ONLINE', 'Online'],
  HYBRID: ['HYBRID', 'Group Classes', 'Coaching Center'],
};
function canonicalModeKey(mode: string): string {
  return TEACHING_MODE_MAP[mode] || mode;
}
function expandTeachingModes(modes: string[]): string[] {
  const expanded = modes.flatMap((m) => TEACHING_MODE_CLASSES[canonicalModeKey(m)] || [m]);
  return Array.from(new Set(expanded));
}

export class RequirementService {
  private repository = new RequirementRepository();

  async createRequirement(studentUserId: string, data: any) {
    const requirementData = {
      ...data,
      teachingMode: normalizeTeachingModes(data.teachingMode) || data.teachingMode,
      studentUserId,
      status: 'OPEN',
      applicationsCount: 0,
    };
    const req = await this.repository.create(requirementData);

    // Trigger match notifications for matching tutors (delayed check for accuracy)
    try {
      const subject = req.curriculum?.subject || req.category;
      if (subject) {
        const matchingTutors = await TutorProfileModel.find({
          subjects: subject,
          userId: { $ne: studentUserId },
        });
        for (const tutor of matchingTutors) {
          notificationQueue
            .add(
              'new-requirements-match',
              {
                type: 'NEW_REQUIREMENTS_MATCH',
                data: {
                  tutorUserId: tutor.userId,
                },
              },
              { delay: 10000 }
            )
            .catch((err) => {
              console.error('Failed to enqueue matched requirement notification:', err);
            });
        }
      }
    } catch (err) {
      console.error('Failed to schedule match notifications:', err);
    }

    return req;
  }

  async getMyRequirements(studentUserId: string) {
    const requirements = await this.repository.findByStudentId(studentUserId);
    const { ApplicationModel } = await import('database');

    const enriched = await Promise.all(
      requirements.map(async (req) => {
        const reqObj = req.toObject();
        const newCount = await ApplicationModel.countDocuments({
          requirementId: req._id,
          status: 'SENT',
        });
        return {
          ...reqObj,
          newApplicationsCount: newCount,
        };
      })
    );

    return enriched;
  }

  async getRequirementDetail(id: string, viewerUserId?: string) {
    const requirement = await this.repository.findById(id);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Load Student name, city, and avatarUrl for detail view
    const studentUser = await prisma.user.findUnique({
      where: { id: requirement.studentUserId },
      select: { name: true, city: true, avatarUrl: true },
    });

    const isOwner = viewerUserId === requirement.studentUserId;
    const reqObj = requirement.toObject();

    // Hide precise details for non-owners (e.g. Tutors)
    if (!isOwner) {
      if (reqObj.location) {
        reqObj.location.address = undefined;
      }
    }

    return {
      ...reqObj,
      studentName: studentUser?.name || 'Anonymous Student',
      studentCity: studentUser?.city || requirement.location.city,
      studentAvatarUrl: studentUser?.avatarUrl || null,
    };
  }

  async getRequirements(filters: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { status: 'OPEN', isDeleted: { $ne: true } }; // Only open requirements are visible to explore

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.subject) {
      query['curriculum.subject'] = filters.subject;
    }
    if (filters.teachingMode) {
      const requested = Array.isArray(filters.teachingMode)
        ? filters.teachingMode
        : [filters.teachingMode];
      query.teachingMode = { $in: expandTeachingModes(requested) };
    }
    if (filters.city) {
      query['location.city'] = { $regex: new RegExp(filters.city, 'i') };
    }
    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      const minVal = filters.minBudget ? Number(filters.minBudget) : null;
      const maxVal = filters.maxBudget ? Number(filters.maxBudget) : null;
      if (minVal !== null || maxVal !== null) {
        const budgetQuery: any = {};
        if (minVal !== null) budgetQuery.$gte = minVal;
        if (maxVal !== null) budgetQuery.$lte = maxVal;
        query['budget.min'] = budgetQuery;
      }
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { 'curriculum.subject': searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const { items, total } = await this.repository.findWithFilters(query, skip, limit);
    return {
      items,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async getTutorMatchedFeed(tutorUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // 1. Fetch tutor profile
    const tutor = await TutorProfileModel.findOne({ userId: tutorUserId });
    if (!tutor) {
      // Return empty feed if tutor profile not completed yet
      return {
        items: [],
        pagination: { totalCount: 0, totalPages: 0, currentPage: page, limit },
      };
    }

    // 2. Build match queries
    const query: any = {
      status: 'OPEN',
      studentUserId: { $ne: tutorUserId }, // Rule: cannot view own requirements
      isDeleted: { $ne: true },
    };

    // Subject match rule
    if (tutor.subjects && tutor.subjects.length > 0) {
      const subjectNames = tutor.subjects.map((s: any) => s.subject);
      query['curriculum.subject'] = { $in: subjectNames };
    }

    // Teaching modes match rule — expanded so this also matches Requirement documents
    // still holding pre-normalization raw labels (e.g. 'Home Tuition' instead of 'OFFLINE').
    if (tutor.teachingModes && tutor.teachingModes.length > 0) {
      query.teachingMode = { $in: expandTeachingModes(tutor.teachingModes) };
    }

    // Location/City match rule for tutors who teach in person (OFFLINE or HYBRID)
    const needsLocationMatch = tutor.teachingModes.some(
      (m: string) => m === 'OFFLINE' || m === 'HYBRID'
    );
    if (needsLocationMatch && tutor.location?.city) {
      query.$or = [
        { teachingMode: { $in: expandTeachingModes(['ONLINE']) } },
        { 'location.city': { $regex: new RegExp(`^${tutor.location.city}$`, 'i') } },
      ];
    }

    const { items, total } = await this.repository.findWithFilters(query, skip, limit);
    return {
      items,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async updateRequirement(id: string, studentUserId: string, data: any) {
    const requirement = await this.repository.findById(id);
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

    if (requirement.status !== 'OPEN') {
      const err = new Error('Bad Request: Only OPEN requirements can be edited');
      (err as any).statusCode = 400;
      throw err;
    }

    const normalizedModes = normalizeTeachingModes(data.teachingMode);
    const updateData = normalizedModes ? { ...data, teachingMode: normalizedModes } : data;

    return this.repository.update(id, updateData);
  }

  async closeRequirement(id: string, studentUserId: string) {
    const requirement = await this.repository.findById(id);
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

    return this.repository.update(id, { status: 'CLOSED', closedAt: new Date() });
  }
}
