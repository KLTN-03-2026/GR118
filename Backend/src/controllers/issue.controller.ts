import { Request, Response } from "express";
import mongoose from "mongoose";
import Issue from "../models/issue.model";

// Danh sách category hợp lệ (phù hợp với schema)
const VALID_CATEGORIES = ["road", "garbage", "lighting", "flood", "noise", "other"] as const;

// Controller xử lý cập nhật một issue
export const updateIssue = async (req: Request, res: Response) => {
  try {
    // Lấy id từ params (có thể là _id của MongoDB hoặc issueCode của hệ thống)
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;

    // Lấy các trường được phép cập nhật từ body
    const {
      title,
      category,
      description,
      lat,
      lng,
      location,
      district,
      ward,
      city
    } = req.body;

    // Validate category nếu được gửi lên
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category value." });
    }

    // Build object cập nhật chỉ chứa các trường hiện có
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;
    if (location !== undefined) updateData.location = location;
    if (district !== undefined) updateData.district = district;
    if (ward !== undefined) updateData.ward = ward;
    if (city !== undefined) updateData.city = city;

    // Luôn cập nhật updatedAt
    updateData.updatedAt = new Date();

    // Tìm kiếm theo _id nếu id là ObjectId hợp lệ, ngược lại tìm theo issueCode
    let issue = null;
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      issue = await Issue.findByIdAndUpdate(idStr, updateData, { new: true });
    }

    if (!issue) {
      // Nếu chưa tìm thấy theo _id, tìm theo issueCode
      issue = await Issue.findOneAndUpdate({ issueCode: idStr }, updateData, { new: true });
    }

    // Nếu vẫn không tìm thấy, trả về 404
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // Trả về issue đã được cập nhật
    return res.status(200).json(issue);
  } catch (error) {
    // Bắt mọi lỗi hệ thống và trả về 500
    console.error("Error updating issue:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
