import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Issue, Verification, ProcessingStep } from "../data/issues";
import { api } from "../../utils/api";
import { toast } from "sonner";

interface IssuesContextType {
  issues: Issue[];
  addIssue: (issue: Issue) => void;
  updateIssue: (id: string, updatedIssue: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  addVerification: (issueId: string, verification: Verification) => Promise<boolean>;
  reviewVerification: (issueId: string, verificationId: string, adminNote: string) => void;
  receiveIssue: (id: string, moderatorId: string, moderatorName: string) => void;
  assignIssue: (id: string, assignedTo: string, moderatorId: string, moderatorName: string) => void;
  startProcessing: (id: string, note: string, moderatorId: string, moderatorName: string) => void;
  requestAdditionalInfo: (id: string, request: string, moderatorId: string, moderatorName: string) => void;
  completeIssue: (id: string, note: string, evidence: string[], moderatorId: string, moderatorName: string) => void;
  rejectIssue: (id: string, note: string, moderatorId: string, moderatorName: string) => void;
  voteIssue: (id: string, userId: string) => Promise<boolean>;
  addComment: (id: string, comment: any) => Promise<boolean>;
  refreshIssues: () => Promise<void>;
}

const IssuesContext = createContext<IssuesContextType | null>(null);

function addProcessingStep(issue: Issue, step: Omit<ProcessingStep, "id">): ProcessingStep[] {
  const newStep: ProcessingStep = {
    ...step,
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  return [...(issue.processingHistory || []), newStep];
}

export function IssuesProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await api.get("/issues");
      if (res.success && res.data) {
        const normalizedIssues = res.data.map((i: any) => ({
          ...i,
          id: i.id || i._id,
        }));
        setIssues(normalizedIssues);
      }
    } catch (error) {
      console.error("Failed to load issues in context:", error);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const addIssue = (issue: Issue) => {
    const normalizedIssue = {
      ...issue,
      id: issue.id || (issue as any)._id,
    };
    setIssues((prev) => [normalizedIssue, ...prev]);
  };

  const updateIssue = (id: string, updatedIssue: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? { ...issue, ...updatedIssue, updatedAt: new Date().toISOString() }
          : issue
      )
    );
  };

  const deleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
  };

  const addVerification = async (issueId: string, verification: Verification) => {
    try {
      const res = await api.post(`/issues/${issueId}/verifications`, verification);
      if (res.success && res.data) {
        setIssues((prev) =>
          prev.map((i) => (i.id === issueId ? { ...i, ...res.data, id: res.data._id || res.data.id } : i))
        );
        return true;
      }
      if (res.message) toast.error(res.message);
      return false;
    } catch (error) {
      console.error("Lỗi khi thêm đánh giá:", error);
      return false;
    }
  };

  const reviewVerification = (issueId: string, verificationId: string, adminNote: string) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              verifications: issue.verifications?.map((v) =>
                v.id === verificationId
                  ? { ...v, adminReviewed: true, adminNote }
                  : v
              ),
              updatedAt: new Date().toISOString(),
            }
          : issue
      )
    );
  };

  const receiveIssue = (id: string, moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "received",
          note: "Báo cáo đã được tiếp nhận và đang chờ phân công xử lý.",
          actorId: moderatorId,
          actorName: moderatorName,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          status: "received",
          moderatorId,
          moderatorName,
          receivedAt: new Date().toISOString(),
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const assignIssue = (id: string, assignedTo: string, moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "assigned",
          note: `Báo cáo đã được phân công cho: ${assignedTo}`,
          actorId: moderatorId,
          actorName: moderatorName,
          assignedTo,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          assignedTo,
          assignedAt: new Date().toISOString(),
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const startProcessing = (id: string, note: string, moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "processing",
          note: note || "Báo cáo đang được xử lý.",
          actorId: moderatorId,
          actorName: moderatorName,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          status: "processing",
          processingNote: note,
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const requestAdditionalInfo = (id: string, request: string, moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "need_info",
          note: request,
          actorId: moderatorId,
          actorName: moderatorName,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          status: "need_info",
          additionalInfoRequest: request,
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const completeIssue = (id: string, note: string, evidence: string[], moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "resolved",
          note,
          actorId: moderatorId,
          actorName: moderatorName,
          evidence,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          status: "resolved",
          completionNote: note,
          completionEvidence: evidence,
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const rejectIssue = (id: string, note: string, moderatorId: string, moderatorName: string) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        const history = addProcessingStep(issue, {
          action: "rejected",
          note,
          actorId: moderatorId,
          actorName: moderatorName,
          createdAt: new Date().toISOString(),
        });
        return {
          ...issue,
          status: "rejected",
          processingHistory: history,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const voteIssue = async (id: string, userId: string): Promise<boolean> => {
    try {
      const res = await api.post(`/issues/${id}/vote`, { userId });
      if (res.success && res.data) {
        setIssues((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...res.data, id: res.data._id || res.data.id } : i))
        );
        return true;
      }
      if (res.message) toast.error(res.message);
      return false;
    } catch (error) {
      console.error("Lỗi khi vote:", error);
      return false;
    }
  };

  const addComment = async (id: string, comment: any): Promise<boolean> => {
    try {
      const res = await api.post(`/issues/${id}/comments`, comment);
      if (res.success && res.data) {
        setIssues((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...res.data, id: res.data._id || res.data.id } : i))
        );
        return true;
      }
      if (res.message) toast.error(res.message);
      return false;
    } catch (error) {
      console.error("Lỗi khi add comment:", error);
      return false;
    }
  };

  return (
    <IssuesContext.Provider value={{
      issues, addIssue, updateIssue, deleteIssue, addVerification, reviewVerification,
      receiveIssue, assignIssue, startProcessing, requestAdditionalInfo, completeIssue, rejectIssue,
      voteIssue, addComment, refreshIssues: fetchIssues
    }}>
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) {
    console.warn("useIssues called outside of IssuesProvider");
    return {
      issues: [],
      addIssue: () => {},
      updateIssue: () => {},
      deleteIssue: () => {},
      addVerification: () => {},
      reviewVerification: () => {},
      receiveIssue: () => {},
      assignIssue: () => {},
      startProcessing: () => {},
      requestAdditionalInfo: () => {},
      completeIssue: () => {},
      rejectIssue: () => {},
      voteIssue: async () => false,
      addComment: async () => false,
      refreshIssues: async () => {},
    };
  }
  return context;
}