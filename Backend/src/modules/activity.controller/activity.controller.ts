import { Request, Response } from "express";
import { activityRepo } from "../../repos/activity.repo";

export const getAllActivities = async (req: Request, res: Response) => {
  try {
    const activities = await activityRepo.getAllActivities();
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("Lỗi khi lấy activities:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await activityRepo.getActivityById(id);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoạt động" });
    }
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const activityData = req.body;
    const newActivity = await activityRepo.createActivity(activityData);
    res.status(201).json({ success: true, data: newActivity, message: "Tạo hoạt động thành công" });
  } catch (error) {
    console.error("Lỗi khi tạo activity:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const registerParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const participantData = req.body;
    
    // Validate if activity allows
    const activity = await activityRepo.getActivityById(id);
    if (!activity || !activity.registrationOpen || activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ success: false, message: "Không thể đăng ký hoạt động này" });
    }

    const updatedActivity = await activityRepo.registerParticipant(id, participantData);
    res.status(200).json({ success: true, data: updatedActivity, message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const cancelRegistration = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body; // or req.user
  
      const updatedActivity = await activityRepo.cancelRegistration(id, userId);
      if (!updatedActivity) {
        return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không thể hủy" });
      }
      res.status(200).json({ success: true, data: updatedActivity, message: "Hủy đăng ký thành công" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
  };

export const updateActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityData = req.body;
    const updatedActivity = await activityRepo.updateActivity(id, activityData);
    if (!updatedActivity) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoạt động để cập nhật" });
    }
    res.status(200).json({ success: true, data: updatedActivity, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật activity:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await activityRepo.deleteActivity(id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoạt động để xóa" });
    }
    res.status(200).json({ success: true, message: "Xóa hoạt động thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa activity:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};
