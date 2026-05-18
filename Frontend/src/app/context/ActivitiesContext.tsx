import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Activity, Participant } from "../data/activities";
import { api } from "../../utils/api";
import { toast } from "sonner";

interface ActivitiesContextType {
  activities: Activity[];
  participants: Participant[];
  getActivity: (id: string) => Activity | undefined;
  getActivityParticipants: (activityId: string) => Participant[];
  getUserParticipations: (userId: string) => Participant[];
  addActivity: (activity: Omit<Activity, "id" | "createdAt" | "updatedAt" | "currentParticipants">) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  registerForActivity: (activityId: string, participant: Omit<Participant, "id" | "registeredAt" | "status">) => void;
  cancelRegistration: (participantId: string) => Promise<boolean>;
  updateParticipantStatus: (participantId: string, status: Participant["status"]) => void;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get("/activities");
        if (response.success && response.data) {
          const normalized = response.data.map((a: any) => ({
            ...a,
            id: a.id || a._id,
            participants: a.participants?.map((p: any) => ({ ...p, id: p.id || p._id })) || []
          }));
          setActivities(normalized);
          
          // Also extract all participants for the participants state
          const allParticipants: Participant[] = [];
          normalized.forEach((a: Activity) => {
            if (a.participants) {
              allParticipants.push(
                ...a.participants.map((p: any) => ({
                  ...p,
                  id: p.id || p._id,
                  activityId: a.id
                }))
              );
            }
          });
          setParticipants(allParticipants);
        }
      } catch (error) {
        console.error("Failed to load activities:", error);
      }
    };
    fetchActivities();
  }, []);

  const getActivity = (id: string) => {
    return activities.find((a) => a.id === id);
  };

  const getActivityParticipants = (activityId: string) => {
    return participants.filter((p) => p.activityId === activityId && p.status !== "cancelled");
  };

  const getUserParticipations = (userId: string) => {
    return participants.filter((p) => p.userId === userId);
  };

  const addActivity = async (activityData: Omit<Activity, "id" | "createdAt" | "updatedAt" | "currentParticipants">) => {
    try {
      const response = await api.post("/activities", activityData);
      if (response.success && response.data) {
        const newActivity: Activity = {
          ...response.data,
          id: response.data.id || response.data._id,
        };
        setActivities((prev) => [newActivity, ...prev]);
      }
    } catch (error) {
      console.error("Failed to add activity:", error);
      toast.error("Không thể lưu hoạt động lên máy chủ");
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      // Assuming a generic update endpoint exists or create one
      // If no generic update exists, we use status toggle endpoints if that's all we have
      const response = await api.patch(`/activities/${id}`, updates);
      if (response.success && response.data) {
        setActivities((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
        );
      }
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const response = await api.delete(`/activities/${id}`);
      if (response.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
        setParticipants((prev) => prev.filter((p) => p.activityId !== id));
      }
    } catch (error) {
      console.error("Failed to delete activity:", error);
    }
  };

  const registerForActivity = async (
    activityId: string,
    participantData: Omit<Participant, "id" | "registeredAt" | "status">
  ) => {
    try {
      const response = await api.post(`/activities/${activityId}/register`, participantData);
      if (response.success && response.data) {
        // Refresh the activities to get updated counts and participant list
        const updated = response.data;
        const normalized = {
          ...updated,
          id: updated.id || updated._id,
          participants: updated.participants?.map((p: any) => ({
            ...p,
            id: p.id || p._id
          })) || []
        };
        
        setActivities((prev) => prev.map(a => a.id === activityId ? normalized : a));
        
        // Update global participants list
        if (normalized.participants) {
          setParticipants(prev => {
            const others = prev.filter(p => p.activityId !== activityId);
            const mappedParticipants = normalized.participants.map((p: any) => ({
              ...p,
              activityId: activityId
            }));
            return [...others, ...mappedParticipants];
          });
        }
        toast.success("Đăng ký tham gia thành công!");
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại");
    }
  };

  const cancelRegistration = async (participantId: string): Promise<boolean> => {
    // We need activityId to call the API as defined in the controller
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return false;

    try {
      const response = await api.post(`/activities/${participant.activityId}/cancel`, { userId: participant.userId });
      if (response.success && response.data) {
        // Refresh local state similar to register
        const updatedActivity = response.data;
        const normalized = {
          ...updatedActivity,
          id: updatedActivity.id || updatedActivity._id,
          participants: updatedActivity.participants?.map((p: any) => ({
            ...p,
            id: p.id || p._id
          })) || []
        };
        setActivities(prev => prev.map(a => a.id === participant.activityId ? normalized : a));
        
        // Update global participants list
        if (normalized.participants) {
          setParticipants(prev => {
            const others = prev.filter(p => p.activityId !== participant.activityId);
            const mappedParticipants = normalized.participants.map((p: any) => ({
              ...p,
              activityId: participant.activityId
            }));
            return [...others, ...mappedParticipants];
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Lỗi khi hủy đăng ký:", error);
      return false;
    }
  };

  const updateParticipantStatus = (participantId: string, status: Participant["status"]) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, status } : p))
    );
  };

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        participants,
        getActivity,
        getActivityParticipants,
        getUserParticipations,
        addActivity,
        updateActivity,
        deleteActivity,
        registerForActivity,
        cancelRegistration,
        updateParticipantStatus,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivitiesContext);
  if (!context) {
    console.warn("useActivities called outside of ActivitiesProvider");
    return {
      activities: [],
      participants: [],
      getActivity: (_id: string) => undefined,
      getActivityParticipants: (_activityId: string) => [],
      getUserParticipations: (_userId: string) => [],
      addActivity: () => {},
      updateActivity: () => {},
      deleteActivity: () => {},
      registerForActivity: () => {},
      cancelRegistration: async () => false,
      updateParticipantStatus: () => {},
    };
  }
  return context;
}