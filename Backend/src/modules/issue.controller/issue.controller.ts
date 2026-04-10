import { Request, Response } from "express";
import { issueRepo } from "../../repos/issue.repo";

const normalizeParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
};

export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const issues = await issueRepo.getAllIssues();
    res.status(200).json({ success: true, data: issues });
  } catch (error) {
    console.error("Lỗi khi lấy issues:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getIssueById = async (req: Request, res: Response) => {
  try {
    const id = normalizeParam(req.params.id);
    const issue = await issueRepo.getIssueById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const createIssue = async (req: Request, res: Response) => {
  try {
    const issueData = req.body;
    const newIssue = await issueRepo.createIssue(issueData);
    res.status(201).json({ success: true, data: newIssue, message: "Báo cáo thành công" });
  } catch (error) {
    console.error("❌ [CREATE ISSUE ERROR]", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ", detail: error instanceof Error ? error.message : error });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const id = normalizeParam(req.params.id);
    const { status, note } = req.body;
    const updatedIssue = await issueRepo.updateIssueStatus(id, status, note);
    if (!updatedIssue) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    res.status(200).json({ success: true, data: updatedIssue, message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const verifyIssue = async (req: Request, res: Response) => {
  try {
    const id = normalizeParam(req.params.id);
    const verificationData = req.body;
    
    // In a real app we'd get user info from JWT, here we assume it's in body
    const updatedIssue = await issueRepo.addVerification(id, verificationData);
    if (!updatedIssue) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    res.status(200).json({ success: true, data: updatedIssue, message: "Thêm đánh giá thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const upvoteIssue = async (req: Request, res: Response) => {
  try {
    const id = normalizeParam(req.params.id);
    const updatedIssue = await issueRepo.voteIssue(id);
    if (!updatedIssue) {
      return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    res.status(200).json({ success: true, data: updatedIssue, message: "Vote thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};
