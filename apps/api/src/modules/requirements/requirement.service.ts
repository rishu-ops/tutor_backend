/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequirementRepository } from './requirement.repository.js';
import { prisma, TutorProfileModel } from 'database';

export class RequirementService {
  private repository = new RequirementRepository();

  async createRequirement(studentUserId: string, data: any) {
    const requirementData = {
      ...data,
      studentUserId,
      status: 'OPEN',
      applicationsCount: 0,
    };
    return this.repository.create(requirementData);
  }

  async getMyRequirements(studentUserId: string) {
    return this.repository.findByStudentId(studentUserId);
  }

  async getRequirementDetail(id: string, viewerUserId?: string) {
    const requirement = await this.repository.findById(id);
    if (!requirement) {
      const err = new Error('Requirement not found');
      (err as any).statusCode = 404;
      throw err;
    }

    // Load Student name and city for detail view
    const studentUser = await prisma.user.findUnique({
      where: { id: requirement.studentUserId },
      select: { name: true, city: true },
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
    };
  }

  async getRequirements(filters: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { status: 'OPEN' }; // Only open requirements are visible to explore

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.subject) {
      query['curriculum.subject'] = filters.subject;
    }
    if (filters.teachingMode) {
      query.teachingMode = filters.teachingMode;
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
    };

    // Subject match rule
    if (tutor.subjects && tutor.subjects.length > 0) {
      const subjectNames = tutor.subjects.map((s: any) => s.subject);
      query['curriculum.subject'] = { $in: subjectNames };
    }

    // Teaching modes match rule
    if (tutor.teachingModes && tutor.teachingModes.length > 0) {
      query.teachingMode = { $in: tutor.teachingModes };
    }

    // Location/City match rule for offline/Home Tuition modes
    const needsLocationMatch = tutor.teachingModes.some(
      (m: string) => m === 'Home Tuition' || m === 'Group Classes'
    );
    if (needsLocationMatch && tutor.location?.city) {
      query.$or = [
        { teachingMode: 'Online' },
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

    return this.repository.update(id, data);
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

    return this.repository.update(id, { status: 'CLOSED' });
  }
}
