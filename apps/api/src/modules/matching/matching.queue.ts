import { Queue, Worker } from 'bullmq';
import { RequirementModel, TutorProfileModel, TutorRequirementMatchModel, prisma } from 'database';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

export const matchingQueue = new Queue('matching-queue', { connection });

function calculateAlignment(req: any, tutor: any) {
  let score = 0;
  const breakdown = {
    subjectMatch: false,
    levelMatch: false,
    modeMatch: false,
    locationMatch: false,
    budgetMatch: false,
  };

  const reqSubject = req.curriculum?.subject || '';
  const reqLevel = req.curriculum?.level || '';

  // 1. Subject Match (40 pts)
  const hasSubjectMatch = tutor.subjects.some(
    (s: any) => s.subject.toLowerCase() === reqSubject.toLowerCase()
  );
  if (hasSubjectMatch) {
    score += 40;
    breakdown.subjectMatch = true;
  }

  // 2. Class / Level Match (15 pts)
  const hasLevelMatch = tutor.subjects.some(
    (s: any) => s.level.toLowerCase() === reqLevel.toLowerCase()
  );
  if (hasLevelMatch) {
    score += 15;
    breakdown.levelMatch = true;
  }

  // 3. Teaching Mode Match (15 pts)
  const sharedModes = req.teachingMode.filter((mode: string) => tutor.teachingModes.includes(mode));
  if (sharedModes.length > 0) {
    score += 15;
    breakdown.modeMatch = true;
  }

  // 4. Distance / Location Match (15 pts)
  const isOnline = req.teachingMode.includes('Online');
  if (isOnline) {
    score += 15;
    breakdown.locationMatch = true;
  } else if (tutor.location?.city && req.location?.city) {
    const cityMatches = tutor.location.city.toLowerCase() === req.location.city.toLowerCase();
    const areaMatches =
      tutor.location.area &&
      req.location.area &&
      tutor.location.area.toLowerCase() === req.location.area.toLowerCase();

    if (cityMatches && areaMatches) {
      score += 15;
      breakdown.locationMatch = true;
    } else if (cityMatches) {
      score += 8;
      breakdown.locationMatch = true;
    }
  }

  // 5. Budget Match (15 pts)
  if (tutor.pricing && req.budget) {
    const budgetOverlap =
      req.budget.min <= tutor.pricing.max && req.budget.max >= tutor.pricing.min;
    if (budgetOverlap) {
      score += 15;
      breakdown.budgetMatch = true;
    }
  }

  let strength: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score >= 70) strength = 'HIGH';
  else if (score >= 35) strength = 'MEDIUM';

  return { score, strength, breakdown };
}

export const matchingWorker = new Worker(
  'matching-queue',
  async (job: any) => {
    const { tutorUserId, requirementId } = job.data;
    console.log(`Processing match scoring for Tutor: ${tutorUserId}, Req: ${requirementId}`);

    try {
      const tutor = await TutorProfileModel.findOne({ userId: tutorUserId });
      const requirement = await RequirementModel.findById(requirementId);

      if (!tutor || !requirement) {
        console.error(`Tutor or Requirement not found during matching worker run.`);
        await TutorRequirementMatchModel.findOneAndUpdate(
          { tutorUserId, requirementId },
          { status: 'FAILED' }
        );
        return;
      }

      const { score, strength, breakdown } = calculateAlignment(requirement, tutor);

      await TutorRequirementMatchModel.findOneAndUpdate(
        { tutorUserId, requirementId },
        {
          score,
          strength,
          breakdown,
          status: 'COMPLETED',
        },
        { new: true }
      );

      console.log(`Successfully completed match run: ${strength} (${score}%)`);
    } catch (err) {
      console.error(`Error executing matching worker task:`, err);
      await TutorRequirementMatchModel.findOneAndUpdate(
        { tutorUserId, requirementId },
        { status: 'FAILED' }
      );
      throw err;
    }
  },
  { connection }
);

matchingWorker.on('completed', (job: any) => {
  console.log(`Job matched completed successfully: ${job.id}`);
});

matchingWorker.on('failed', (job: any, err: any) => {
  console.error(`Job matching failed: ${job?.id}, error:`, err);
});
