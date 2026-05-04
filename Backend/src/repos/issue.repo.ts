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
    const issue = await Issue.findById(id);
    if (!issue) return null;

    // Kiểm tra xem người dùng đã đánh giá chưa
    const alreadyVerified = issue.verifications?.some(v => v.userId === verification.userId);
    if (alreadyVerified) {
      throw new Error("ALREADY_VERIFIED");
    }

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

  async voteIssue(id: string, userId: string): Promise<IIssue | null> {
    const issue = await Issue.findById(id);
    if (!issue) return null;

    // Toggle vote
    const userIds = issue.votedUserIds || [];
    const hasVoted = userIds.includes(userId);

    if (hasVoted) {
      return await Issue.findByIdAndUpdate(
        id,
        { $pull: { votedUserIds: userId }, $inc: { votes: -1 } },
        { new: true }
      ).exec();
    } else {
      return await Issue.findByIdAndUpdate(
        id,
        { $addToSet: { votedUserIds: userId }, $inc: { votes: 1 } },
        { new: true }
      ).exec();
    }
  },

  async addComment(id: string, comment: any): Promise<IIssue | null> {
    return await Issue.findByIdAndUpdate(
      id,
      { $push: { commentsList: comment }, $inc: { comments: 1 } },
      { new: true }
    ).exec();
  }
};
