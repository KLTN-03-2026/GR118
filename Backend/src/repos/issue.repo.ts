import Issue, { IIssue, Verification, SpamReport } from "../models/issue.model";

export const issueRepo = {
  async getAllIssues(): Promise<IIssue[]> {
    return await Issue.find().sort({ reportedAt: -1 }).exec();
  },

  async getIssueById(id: string): Promise<IIssue | null> {
    return await Issue.findById(id).exec();
  },

  async createIssue(issueData: Partial<IIssue>): Promise<IIssue> {
    const issue = new Issue(issueData);
    return await issue.save();
  },

  async updateIssueStatus(id: string, status: IIssue["status"], note?: string): Promise<IIssue | null> {
    const update: any = { status, updatedAt: new Date() };
    if (note) update.processingNote = note;
    return await Issue.findByIdAndUpdate(id, update, { new: true }).exec();
  },

  async addVerification(id: string, verification: Verification): Promise<IIssue | null> {
    return await Issue.findByIdAndUpdate(
      id,
      { $push: { verifications: verification }, $inc: { comments: 1 } },
      { new: true }
    ).exec();
  },

  async addSpamReport(id: string, report: SpamReport): Promise<IIssue | null> {
    return await Issue.findByIdAndUpdate(
      id,
      { $push: { spamReports: report } },
      { new: true }
    ).exec();
  },

  async voteIssue(id: string): Promise<IIssue | null> {
    return await Issue.findByIdAndUpdate(
      id,
      { $inc: { votes: 1 } },
      { new: true }
    ).exec();
  }
};
