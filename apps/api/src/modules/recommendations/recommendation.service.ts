import { RequirementModel, TutorProfileModel, prisma } from 'database';

export interface ScoredRequirement {
  requirement: any;
  score: number;
}

export class RecommendationService {
  /**
   * Helper to score a single requirement against a tutor profile
   */
  private scoreRequirement(req: any, tutor: any): number {
    let score = 0;

    const reqSubject = req.curriculum?.subject || '';
    const reqLevel = req.curriculum?.level || '';

    // 1. Subject Match (40 pts)
    const hasSubjectMatch = tutor.subjects.some(
      (s: any) => s.subject.toLowerCase() === reqSubject.toLowerCase()
    );
    if (hasSubjectMatch) {
      score += 40;
    }

    // 2. Category Match (15 pts)
    // If tutor teaches any subject that matches the requirement's subject,
    // it implies they teach in this category.
    if (hasSubjectMatch) {
      score += 15;
    }

    // 3. Class / Level Match (15 pts)
    const hasLevelMatch = tutor.subjects.some(
      (s: any) => s.level.toLowerCase() === reqLevel.toLowerCase()
    );
    if (hasLevelMatch) {
      score += 15;
    }

    // 4. Teaching Mode Match (10 pts)
    const sharedModes = req.teachingMode.filter((mode: string) =>
      tutor.teachingModes.includes(mode)
    );
    if (sharedModes.length > 0) {
      score += 10;
    }

    // 5. Distance / Location Match (10 pts)
    const isOnline = req.teachingMode.includes('Online');
    if (isOnline) {
      score += 10;
    } else if (tutor.location?.city && req.location?.city) {
      const cityMatches = tutor.location.city.toLowerCase() === req.location.city.toLowerCase();
      const areaMatches =
        tutor.location.area &&
        req.location.area &&
        tutor.location.area.toLowerCase() === req.location.area.toLowerCase();

      if (cityMatches && areaMatches) {
        score += 10;
      } else if (cityMatches) {
        score += 5;
      }
    }

    // 6. Budget Match (5 pts)
    if (tutor.pricing && req.budget) {
      const budgetOverlap =
        req.budget.min <= tutor.pricing.max && req.budget.max >= tutor.pricing.min;
      if (budgetOverlap) {
        score += 5;
      }
    }

    // 7. Freshness Match (5 pts)
    const ageInMs = Date.now() - new Date(req.createdAt).getTime();
    const ageInHours = ageInMs / (1000 * 60 * 60);
    if (ageInHours <= 24) {
      score += 5;
    } else if (ageInHours <= 72) {
      score += 3;
    } else if (ageInHours <= 168) {
      score += 1;
    }

    return score;
  }

  /**
   * Filter and score requirements for a specific tutor profile
   */
  private async getScoredRequirements(tutorUserId: string): Promise<ScoredRequirement[]> {
    const tutor = await TutorProfileModel.findOne({ userId: tutorUserId });
    if (!tutor) {
      return [];
    }

    // Load open requirements (excluding tutor's own and soft-deleted ones)
    const requirements = await RequirementModel.find({
      status: 'OPEN',
      studentUserId: { $ne: tutorUserId },
      isDeleted: { $ne: true },
    });

    const scored: ScoredRequirement[] = [];

    for (const req of requirements) {
      // --- STAGE 1: HARD FILTERS ---

      // Teaching Mode overlap check
      const sharedModes = req.teachingMode.filter((mode: string) =>
        tutor.teachingModes.includes(mode)
      );
      if (sharedModes.length === 0) {
        continue; // Exclude if teaching modes are completely incompatible
      }

      // Offline mode location/city match check
      const hasOfflineModesOnly = req.teachingMode.every((mode: string) => mode !== 'Online');
      if (hasOfflineModesOnly && tutor.location?.city && req.location?.city) {
        const cityMatches = tutor.location.city.toLowerCase() === req.location.city.toLowerCase();
        if (!cityMatches) {
          continue; // Exclude if offline and in a different city
        }
      }

      // --- STAGE 2: SCORE & RANK ---
      const score = this.scoreRequirement(req, tutor);
      scored.push({ requirement: req, score });
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Get modular/bucketed recommendations for the tutor dashboard
   */
  async getHomeRecommendations(tutorUserId: string) {
    const scored = await this.getScoredRequirements(tutorUserId);
    const tutor = await TutorProfileModel.findOne({ userId: tutorUserId });

    const recommended = scored
      .filter((s) => s.score >= 50)
      .map((s) => ({ ...s.requirement.toObject(), score: s.score }))
      .slice(0, 5);

    const recent = [...scored]
      .sort(
        (a, b) =>
          new Date(b.requirement.createdAt).getTime() - new Date(a.requirement.createdAt).getTime()
      )
      .map((s) => s.requirement)
      .slice(0, 5);

    const nearby = scored
      .filter((s) => {
        const isOffline = s.requirement.teachingMode.some(
          (m: string) => m === 'Home Tuition' || m === 'Group Classes'
        );
        const cityMatches =
          tutor?.location?.city &&
          s.requirement.location?.city &&
          tutor.location.city.toLowerCase() === s.requirement.location.city.toLowerCase();
        return isOffline && cityMatches;
      })
      .map((s) => s.requirement)
      .slice(0, 5);

    const highBudget = [...scored]
      .sort((a, b) => b.requirement.budget.max - a.requirement.budget.max)
      .map((s) => s.requirement)
      .slice(0, 5);

    const tutorSubjects = tutor?.subjects.map((s: any) => s.subject.toLowerCase()) || [];
    const explore = scored
      .filter((s) => {
        const reqSubject = s.requirement.curriculum?.subject?.toLowerCase() || '';
        return !tutorSubjects.includes(reqSubject);
      })
      .map((s) => s.requirement)
      .slice(0, 5);

    const posts = await prisma.adminPost.findMany({
      where: { status: 'PUBLISHED' },
      include: { author: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return {
      recommended,
      recent,
      nearby,
      highBudget,
      explore,
      posts,
    };
  }

  /**
   * Get single recommendation section paginated list
   */
  async getSectionRecommendations(
    tutorUserId: string,
    section: string,
    page: number = 1,
    limit: number = 10
  ) {
    const scored = await this.getScoredRequirements(tutorUserId);
    const tutor = await TutorProfileModel.findOne({ userId: tutorUserId });

    let items: any[];

    switch (section) {
      case 'recommended':
        items = scored
          .filter((s) => s.score >= 50)
          .map((s) => ({ ...s.requirement.toObject(), score: s.score }));
        break;

      case 'recent':
        items = [...scored]
          .sort(
            (a, b) =>
              new Date(b.requirement.createdAt).getTime() -
              new Date(a.requirement.createdAt).getTime()
          )
          .map((s) => s.requirement);
        break;

      case 'nearby':
        items = scored
          .filter((s) => {
            const isOffline = s.requirement.teachingMode.some(
              (m: string) => m === 'Home Tuition' || m === 'Group Classes'
            );
            const cityMatches =
              tutor?.location?.city &&
              s.requirement.location?.city &&
              tutor.location.city.toLowerCase() === s.requirement.location.city.toLowerCase();
            return isOffline && cityMatches;
          })
          .map((s) => s.requirement);
        break;

      case 'high-budget':
        items = [...scored]
          .sort((a, b) => b.requirement.budget.max - a.requirement.budget.max)
          .map((s) => s.requirement);
        break;

      case 'explore': {
        const tutorSubjects = tutor?.subjects.map((s: any) => s.subject.toLowerCase()) || [];
        items = scored
          .filter((s) => {
            const reqSubject = s.requirement.curriculum?.subject?.toLowerCase() || '';
            return !tutorSubjects.includes(reqSubject);
          })
          .map((s) => s.requirement);
        break;
      }

      default:
        items = scored.map((s) => s.requirement);
        break;
    }

    const total = items.length;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }
}
