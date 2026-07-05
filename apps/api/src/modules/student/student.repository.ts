/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudentProfileModel } from 'database';

export class StudentRepository {
  async findByUserId(userId: string) {
    return StudentProfileModel.findOne({ userId });
  }

  async updateByUserId(userId: string, data: any) {
    return StudentProfileModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true } // Returns the updated document
    );
  }
}
