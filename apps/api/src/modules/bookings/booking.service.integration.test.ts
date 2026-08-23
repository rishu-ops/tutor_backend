import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  prisma,
  connectMongoDB,
  connectPostgres,
  disconnectDatabases,
  BookingModel,
  ConversationModel,
  TutorProfileModel,
  ReportModel,
} from 'database';
import { BookingService } from './booking.service.js';

// Integration tests: these run against the real Postgres + MongoDB the app uses
// locally (docker-compose). They create their own isolated fixtures and clean
// up everything they create, so they're safe to run against a shared dev DB.

const service = new BookingService();
const runId = Date.now().toString().slice(-8);

let student: { id: string };
let onlineOnlyTutor: { id: string };
let strangerTutor: { id: string };
let conversationId: string;

beforeAll(async () => {
  await connectPostgres();
  await connectMongoDB(process.env.MONGODB_URI!);

  student = await prisma.user.create({
    data: { phone: `+91${runId}01`, role: 'STUDENT', name: 'Test Student', isPhoneVerified: true },
  });
  onlineOnlyTutor = await prisma.user.create({
    data: { phone: `+91${runId}02`, role: 'TUTOR', name: 'Test Tutor', isPhoneVerified: true },
  });
  strangerTutor = await prisma.user.create({
    data: { phone: `+91${runId}03`, role: 'TUTOR', name: 'Stranger Tutor', isPhoneVerified: true },
  });

  await TutorProfileModel.create({
    userId: onlineOnlyTutor.id,
    bio: 'Test tutor bio for integration tests, long enough to pass validation checks.',
    subjects: [{ subject: 'Physics', level: 'Class 12', experienceYears: 5 }],
    teachingModes: ['ONLINE'],
    languages: ['English'],
    pricing: { min: 500, max: 1000 },
    location: { city: 'Test City', area: 'Test Area' },
  });

  const convo = await ConversationModel.create({
    studentUserId: student.id,
    tutorUserId: onlineOnlyTutor.id,
    requirementId: 'integration-test-requirement',
    applicationId: `integration-test-${runId}`,
    status: 'ACTIVE',
  });
  conversationId = convo._id.toString();
});

afterAll(async () => {
  await BookingModel.deleteMany({ studentUserId: student.id });
  await ReportModel.deleteMany({ targetId: { $exists: true }, reporterId: student.id });
  await ConversationModel.deleteMany({ _id: conversationId });
  await TutorProfileModel.deleteMany({ userId: onlineOnlyTutor.id });
  await prisma.user.deleteMany({
    where: { id: { in: [student.id, onlineOnlyTutor.id, strangerTutor.id] } },
  });
  await disconnectDatabases();
});

describe('BookingService.createBooking', () => {
  it('rejects a session mode the tutor does not offer', async () => {
    await expect(
      service.createBooking({
        requirementId: '000000000000000000000000',
        creatorUserId: student.id,
        partnerUserId: onlineOnlyTutor.id,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isFirstSession: true,
        sessionMode: 'ONSITE',
      })
    ).rejects.toThrow(/does not offer onsite/i);
  });

  it('accepts a session mode the tutor does offer', async () => {
    const booking = await service.createBooking({
      requirementId: '000000000000000000000000',
      creatorUserId: student.id,
      partnerUserId: onlineOnlyTutor.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isFirstSession: true,
      sessionMode: 'ONLINE',
    });
    expect(booking.sessionMode).toBe('ONLINE');
    expect(booking.status).toBe('PENDING');
  });

  it('rejects booking a user with no prior conversation (IDOR guard)', async () => {
    await expect(
      service.createBooking({
        requirementId: '000000000000000000000000',
        creatorUserId: student.id,
        partnerUserId: strangerTutor.id,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isFirstSession: true,
        sessionMode: 'ONLINE',
      })
    ).rejects.toThrow(/already have a conversation/i);
  });

  it('rejects a partner with the wrong role', async () => {
    await expect(
      service.createBooking({
        requirementId: '000000000000000000000000',
        creatorUserId: student.id,
        partnerUserId: student.id, // another student, not a tutor
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isFirstSession: true,
        sessionMode: 'ONLINE',
      })
    ).rejects.toThrow(/wrong role/i);
  });
});

describe('BookingService status state machine', () => {
  it('rejects completing or reporting a no-show on a PENDING booking', async () => {
    const booking = await service.createBooking({
      requirementId: '000000000000000000000000',
      creatorUserId: student.id,
      partnerUserId: onlineOnlyTutor.id,
      scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      isFirstSession: true,
      sessionMode: 'ONLINE',
    });
    const id = booking._id.toString();

    await expect(service.updateBookingStatus(id, 'COMPLETED', onlineOnlyTutor.id)).rejects.toThrow(
      /PENDING/
    );
    await expect(service.reportNoShow(id, student.id)).rejects.toThrow(/PENDING/);
  });

  it('rejects completing a session before its scheduled start time', async () => {
    const future = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    const booking = await service.createBooking({
      requirementId: '000000000000000000000000',
      creatorUserId: student.id,
      partnerUserId: onlineOnlyTutor.id,
      scheduledAt: future,
      isFirstSession: true,
      sessionMode: 'ONLINE',
    });
    const id = booking._id.toString();

    await service.updateBookingStatus(id, 'ACCEPTED', onlineOnlyTutor.id);
    await expect(service.updateBookingStatus(id, 'COMPLETED', onlineOnlyTutor.id)).rejects.toThrow(
      /before its scheduled start time/i
    );
  });

  it('allows either party to mark a past, accepted session complete', async () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const booking = await BookingModel.create({
      requirementId: '000000000000000000000000',
      studentUserId: student.id,
      tutorUserId: onlineOnlyTutor.id,
      scheduledAt: past,
      duration: 60,
      sessionMode: 'ONLINE',
      isFirstSession: true,
      status: 'ACCEPTED',
      requestedBy: student.id,
    });

    const updated = await service.updateBookingStatus(
      booking._id.toString(),
      'COMPLETED',
      student.id
    );
    expect(updated.status).toBe('COMPLETED');
    expect(updated.completedBy).toBe(student.id);
  });

  it('rejects reporting a no-show before the session was scheduled to end', async () => {
    const soon = new Date(Date.now() + 5 * 60 * 1000);
    const booking = await BookingModel.create({
      requirementId: '000000000000000000000000',
      studentUserId: student.id,
      tutorUserId: onlineOnlyTutor.id,
      scheduledAt: soon,
      duration: 60,
      sessionMode: 'ONLINE',
      isFirstSession: true,
      status: 'ACCEPTED',
      requestedBy: student.id,
    });

    await expect(service.reportNoShow(booking._id.toString(), student.id)).rejects.toThrow(
      /scheduled to end/i
    );
  });

  it('records a no-show and escalates it to an admin-visible report', async () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const booking = await BookingModel.create({
      requirementId: '000000000000000000000000',
      studentUserId: student.id,
      tutorUserId: onlineOnlyTutor.id,
      scheduledAt: past,
      duration: 60,
      sessionMode: 'ONLINE',
      isFirstSession: true,
      status: 'ACCEPTED',
      requestedBy: student.id,
    });

    const updated = await service.reportNoShow(
      booking._id.toString(),
      student.id,
      'No show at all.'
    );
    expect(updated.status).toBe('NO_SHOW');
    expect(updated.noShowParty).toBe('TUTOR');

    const report = await ReportModel.findOne({ targetId: booking._id.toString() });
    expect(report).not.toBeNull();
    expect(report?.targetType).toBe('BOOKING');
    expect(report?.reason).toBe('NO_SHOW');
  });
});
