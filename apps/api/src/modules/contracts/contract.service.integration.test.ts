import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  prisma,
  connectMongoDB,
  connectPostgres,
  disconnectDatabases,
  ContractModel,
} from 'database';
import { ContractService } from './contract.service.js';

const service = new ContractService();
const runId = Date.now().toString().slice(-8);

let student: { id: string };
let tutor: { id: string };

beforeAll(async () => {
  await connectPostgres();
  await connectMongoDB(process.env.MONGODB_URI!);

  student = await prisma.user.create({
    data: {
      phone: `+92${runId}01`,
      role: 'STUDENT',
      name: 'Contract Test Student',
      isPhoneVerified: true,
    },
  });
  tutor = await prisma.user.create({
    data: {
      phone: `+92${runId}02`,
      role: 'TUTOR',
      name: 'Contract Test Tutor',
      isPhoneVerified: true,
    },
  });
});

afterAll(async () => {
  await ContractModel.deleteMany({ studentUserId: student.id });
  await prisma.user.deleteMany({ where: { id: { in: [student.id, tutor.id] } } });
  await disconnectDatabases();
});

describe('Contract lifecycle', () => {
  it('cannot be terminated before it is fully signed', async () => {
    const contract = await service.createContract(student.id, {
      partnerUserId: tutor.id,
      subject: 'Physics',
      billingType: 'MONTHLY',
      agreedRate: 5000,
    });
    expect(contract.status).toBe('PENDING_SIGNATURES');

    await expect(service.terminateContract(contract._id.toString(), student.id)).rejects.toThrow(
      /PENDING_SIGNATURES/
    );
  });

  it('goes ACTIVE once both parties sign, then TERMINATING with a 7-day notice on termination', async () => {
    const contract = await service.createContract(student.id, {
      partnerUserId: tutor.id,
      subject: 'Chemistry',
      billingType: 'MONTHLY',
      agreedRate: 6000,
    });

    const signed = await service.signContract(
      contract._id.toString(),
      tutor.id,
      'Contract Test Tutor'
    );
    expect(signed.status).toBe('ACTIVE');

    const before = Date.now();
    const terminated = await service.terminateContract(
      contract._id.toString(),
      student.id,
      'Test reason'
    );
    expect(terminated.status).toBe('TERMINATING');
    expect(terminated.terminationRequestedBy).toBe(student.id);
    expect(terminated.terminationReason).toBe('Test reason');

    const noticeDays =
      (new Date(terminated.terminationEffectiveAt!).getTime() - before) / (24 * 60 * 60 * 1000);
    expect(noticeDays).toBeGreaterThan(6.9);
    expect(noticeDays).toBeLessThan(7.1);
  });

  it('cannot be terminated twice', async () => {
    const contract = await service.createContract(student.id, {
      partnerUserId: tutor.id,
      subject: 'Biology',
      billingType: 'MONTHLY',
      agreedRate: 4000,
    });
    await service.signContract(contract._id.toString(), tutor.id, 'Contract Test Tutor');
    await service.terminateContract(contract._id.toString(), student.id);

    await expect(service.terminateContract(contract._id.toString(), student.id)).rejects.toThrow(
      /TERMINATING/
    );
  });

  it('rejects termination from someone who is not a party to the contract', async () => {
    const outsider = await prisma.user.create({
      data: { phone: `+92${runId}03`, role: 'STUDENT', name: 'Outsider', isPhoneVerified: true },
    });
    const contract = await service.createContract(student.id, {
      partnerUserId: tutor.id,
      subject: 'History',
      billingType: 'MONTHLY',
      agreedRate: 3000,
    });
    await service.signContract(contract._id.toString(), tutor.id, 'Contract Test Tutor');

    await expect(service.terminateContract(contract._id.toString(), outsider.id)).rejects.toThrow(
      /not a party/i
    );

    await prisma.user.delete({ where: { id: outsider.id } });
  });
});
