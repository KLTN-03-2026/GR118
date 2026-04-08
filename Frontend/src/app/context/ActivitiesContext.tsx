import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Activity, Participant } from "../data/activities";
import { api } from "../../utils/api";

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
  cancelRegistration: (participantId: string) => void;
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
          setActivities(response.data);
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

  const addActivity = (activityData: Omit<Activity, "id" | "createdAt" | "updatedAt" | "currentParticipants">) => {
    const newActivity: Activity = {
      ...activityData,
      id: `act_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentParticipants: 0,
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, ...updates, updatedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    // Also remove all participants
    setParticipants((prev) => prev.filter((p) => p.activityId !== id));
  };

  const registerForActivity = (
    activityId: string,
    participantData: Omit<Participant, "id" | "registeredAt" | "status">
  ) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    // Check if already registered
    const alreadyRegistered = participants.some(
      (p) =>
        p.activityId === activityId &&
        p.userId === participantData.userId &&
        p.status === "registered"
    );

    if (alreadyRegistered) return;

    const newParticipant: Participant = {
      ...participantData,
      id: `p_${Date.now()}`,
      registeredAt: new Date().toISOString(),
      status: "registered",
    };

    setParticipants((prev) => [...prev, newParticipant]);
    
    // Update current participants count
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? { 
              ...a, 
              currentParticipants: a.currentParticipants + 1,
              updatedAt: new Date().toISOString() 
            }
          : a
      )
    );
  };

  const cancelRegistration = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, status: "cancelled", cancelledAt: new Date().toISOString() }
          : p
      )
    );

    // Update current participants count
    setActivities((prev) =>
      prev.map((a) =>
        a.id === participant.activityId
          ? { 
              ...a, 
              currentParticipants: Math.max(0, a.currentParticipants - 1),
              updatedAt: new Date().toISOString() 
            }
          : a
      )
    );
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
      cancelRegistration: () => {},
      updateParticipantStatus: () => {},
    };
  }
  return context;
}