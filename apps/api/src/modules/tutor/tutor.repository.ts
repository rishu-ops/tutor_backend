/* eslint-disable @typescript-eslint/no-explicit-any */
import { TutorProfileModel } from 'database';

export class TutorRepository {
  async findByUserId(userId: string) {
    return TutorProfileModel.findOne({ userId });
  }

  async updateByUserId(userId: string, data: any) {
    return TutorProfileModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true } // Returns the updated document
    );
  }
}
