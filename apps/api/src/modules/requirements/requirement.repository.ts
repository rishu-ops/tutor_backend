import { RequirementModel } from 'database';

export class RequirementRepository {
  async create(data: any) {
    return RequirementModel.create(data);
  }

  async findByStudentId(studentUserId: string) {
    return RequirementModel.find({ studentUserId }).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return RequirementModel.findById(id);
  }

  async update(id: string, data: any) {
    return RequirementModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } // Returns updated document
    );
  }

  async findWithFilters(filter: any, skip: number, limit: number) {
    const total = await RequirementModel.countDocuments(filter);
    const items = await RequirementModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return { items, total };
  }
}
