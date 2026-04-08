import Activity, { IActivity, Participant } from "../models/activity.model";

export const activityRepo = {
  async getAllActivities(): Promise<IActivity[]> {
    return await Activity.find().sort({ startDate: 1 }).exec();
  },

  async getActivityById(id: string): Promise<IActivity | null> {
    return await Activity.findById(id).exec();
  },

  async createActivity(activityData: Partial<IActivity>): Promise<IActivity> {
    const activity = new Activity(activityData);
    return await activity.save();
  },

  async updateActivityStatus(id: string, status: IActivity["status"]): Promise<IActivity | null> {
    return await Activity.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true }).exec();
  },

  async registerParticipant(id: string, participant: Participant): Promise<IActivity | null> {
    return await Activity.findByIdAndUpdate(
      id,
      { 
        $push: { participants: participant },
        $inc: { currentParticipants: 1 }
      },
      { new: true }
    ).exec();
  },

  async cancelRegistration(id: string, userId: string): Promise<IActivity | null> {
    return await Activity.findOneAndUpdate(
      { _id: id, "participants.userId": userId },
      { 
        $set: { 
          "participants.$.status": "cancelled",
          "participants.$.cancelledAt": new Date() 
        },
        $inc: { currentParticipants: -1 }
      },
      { new: true }
    ).exec();
  }
};
