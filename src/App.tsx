import React, { useState, useEffect } from "react";
import { Mission, Reward, DailyStats, KidProfile, Period, UserSession, ManagedUser, ActivityLog, RedemptionLog, ApprovalRequest } from "./types";
import { DEFAULT_MISSIONS, DEFAULT_REWARDS, DEFAULT_PROFILE, DEFAULT_USERS } from "./initialData";
import KidDashboard from "./components/KidDashboard";
import RewardStore from "./components/RewardStore";
import ProgressReport from "./components/ProgressReport";
import ParentPanel from "./components/ParentPanel";
import LoginScreen from "./components/LoginScreen";
import { TodayIcon, RecompensasIcon, ProgressoIcon, PaisIcon } from "./components/Icons";
import { Calendar, Award, BarChart3, ShieldCheck, HelpCircle, Key, Lock, Sparkles, Star, LogOut, Users, Cloud, CloudOff, RefreshCw, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { 
  playClickSound, 
  playSubtaskPopSound, 
  playMissionSuccessSound, 
  playPointsApprovedSound, 
  playRewardClaimedSound 
} from "./lib/sounds";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"hoje" | "recompensas" | "progresso" | "pais">("hoje");

  // User Session State
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("focus_kids_session");
    return saved ? JSON.parse(saved) : null;
  });

  // Core App States
  const [users, setUsers] = useState<ManagedUser[]>(DEFAULT_USERS);
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [profile, setProfile] = useState<KidProfile>(DEFAULT_PROFILE);
  const [history, setHistory] = useState<DailyStats[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  // Synchronization status
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");

  // Computed: is parent logged in?
  const isParent = session?.role === "pai" || session?.role === "mae" || session?.role === "parent";

  // 1. Listen to all Firestore collections in real-time
  useEffect(() => {
    setSyncStatus("syncing");

    // Listen to users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_USERS.forEach((u) => {
          setDoc(doc(db, "users", u.id), u).catch((err) => console.error("Error seeding default user:", err));
        });
      } else {
        const list: ManagedUser[] = [];
        snapshot.forEach((d) => list.push(d.data() as ManagedUser));
        setUsers(list);
      }
    }, (error) => {
      console.error("Users subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to missions
    const unsubMissions = onSnapshot(collection(db, "missions"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_MISSIONS.forEach((m) => {
          setDoc(doc(db, "missions", m.id), m).catch((err) => console.error("Error seeding default mission:", err));
        });
      } else {
        const list: Mission[] = [];
        snapshot.forEach((d) => list.push(d.data() as Mission));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setMissions(list);
      }
    }, (error) => {
      console.error("Missions subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to rewards
    const unsubRewards = onSnapshot(collection(db, "rewards"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_REWARDS.forEach((r) => {
          setDoc(doc(db, "rewards", r.id), r).catch((err) => console.error("Error seeding default reward:", err));
        });
      } else {
        const list: Reward[] = [];
        snapshot.forEach((d) => list.push(d.data() as Reward));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setRewards(list);
      }
    }, (error) => {
      console.error("Rewards subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to profile
    const unsubProfile = onSnapshot(doc(db, "profiles", "bernardo"), (docSnap) => {
      if (!docSnap.exists()) {
        setDoc(doc(db, "profiles", "bernardo"), DEFAULT_PROFILE).catch((err) => console.error("Error seeding default profile:", err));
        
        // Seed default history only on first-ever database setup!
        const defaultHistory = [
          { date: "2026-07-06", pointsEarned: 35, completedMissions: 3 },
          { date: "2026-07-05", pointsEarned: 50, completedMissions: 5 }
        ];
        defaultHistory.forEach((h, idx) => {
          setDoc(doc(db, "history", "h_" + idx), h).catch((err) => console.error("Error seeding default history:", err));
        });
      } else {
        setProfile(docSnap.data() as KidProfile);
      }
    }, (error) => {
      console.error("Profile subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to history
    const unsubHistory = onSnapshot(collection(db, "history"), (snapshot) => {
      const list: DailyStats[] = [];
      snapshot.forEach((d) => list.push(d.data() as DailyStats));
      list.sort((a, b) => b.date.localeCompare(a.date));
      setHistory(list);
    }, (error) => {
      console.error("History subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to activity logs
    const unsubLogs = onSnapshot(collection(db, "activityLogs"), (snapshot) => {
      if (snapshot.empty) {
        const initialLog = {
          id: "act_init",
          timestamp: new Date().toISOString(),
          userId: "u_david",
          userName: "Pai (David)",
          userAvatar: "👨‍💼",
          type: "points_added",
          title: "Focus Kids conectado e sincronizado no Servidor de Nuvem! ☁️",
          points: 0,
          icon: "☁️"
        };
        setDoc(doc(db, "activityLogs", "act_init"), initialLog).catch((err) => console.error("Error seeding initial log:", err));
      } else {
        const list: ActivityLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as ActivityLog));
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setActivityLogs(list.slice(0, 50));
      }
    }, (error) => {
      console.error("Activity logs subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to redemptions
    const unsubRedemptions = onSnapshot(collection(db, "redemptions"), (snapshot) => {
      const list: RedemptionLog[] = [];
      snapshot.forEach((d) => list.push(d.data() as RedemptionLog));
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setRedemptions(list);
    }, (error) => {
      console.error("Redemptions subscription error:", error);
      setSyncStatus("error");
    });

    // Listen to approvals
    const unsubApprovals = onSnapshot(collection(db, "approvals"), (snapshot) => {
      const list: ApprovalRequest[] = [];
      snapshot.forEach((d) => list.push(d.data() as ApprovalRequest));
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setApprovals(list);
      setSyncStatus("synced");
    }, (error) => {
      console.error("Approvals subscription error:", error);
      setSyncStatus("error");
    });

    return () => {
      unsubUsers();
      unsubMissions();
      unsubRewards();
      unsubProfile();
      unsubHistory();
      unsubLogs();
      unsubRedemptions();
      unsubApprovals();
    };
  }, []);

  // Keep session local storage for continuous login
  useEffect(() => {
    if (session) {
      localStorage.setItem("focus_kids_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("focus_kids_session");
    }
  }, [session]);

  // Automatic daily reset of missions when date changes
  useEffect(() => {
    if (!profile || !missions || missions.length === 0) return;

    const todayStr = getLocalDateString();
    const profileLastReset = profile.lastResetDate;

    // Find any mission that is marked completed but its completedAt date is not today (or is missing)
    const staleCompletedMissions = missions.filter(m => {
      if (!m.completed) return false;
      if (!m.completedAt) return true; // Missing timestamp but is completed
      const completedDay = getLocalDateStringFromISO(m.completedAt);
      return completedDay !== todayStr; // Completed on a previous day
    });

    const hasStaleCompleted = staleCompletedMissions.length > 0;
    const isDifferentDay = profileLastReset && profileLastReset !== todayStr;

    // Check if the reset date on the server is different from today, or if there are completed missions from previous days
    if (isDifferentDay || hasStaleCompleted) {
      console.log(`[Auto-Reset] Resettable missions detected or date mismatch. todayStr: ${todayStr}, profileLastReset: ${profileLastReset}, staleCount: ${staleCompletedMissions.length}`);
      
      const performAutoReset = async () => {
        setSyncStatus("syncing");
        try {
          // 1. Reset all missions
          const promises = missions.map(m => {
            const updateData: any = { completed: false, completedAt: null };
            if (m.subtasks && m.subtasks.length > 0) {
              updateData.completedSubtasks = m.subtasks.map(() => false);
            } else {
              updateData.completedSubtasks = [];
            }
            return updateDoc(doc(db, "missions", m.id), updateData);
          });
          await Promise.all(promises);

          // 2. Update profile with new lastResetDate
          await updateDoc(doc(db, "profiles", "bernardo"), {
            lastResetDate: todayStr
          });

          await logActivity(
            "points_added", 
            `Novo dia (${formatLocalDate(todayStr)})! O progresso de todas as missões diárias de Bernardo foi reiniciado automaticamente. 🔄✨`, 
            0, 
            "🔄"
          );
          setSyncStatus("synced");
        } catch (e) {
          console.error("Error doing auto-reset:", e);
          setSyncStatus("error");
        }
      };

      performAutoReset();
    } else if (!profileLastReset) {
      // First time setting lastResetDate to prevent unexpected first-load reset if they already did tasks today
      const setInitialResetDate = async () => {
        try {
          await updateDoc(doc(db, "profiles", "bernardo"), {
            lastResetDate: todayStr
          });
        } catch (e) {
          console.error("Error setting initial reset date:", e);
        }
      };
      setInitialResetDate();
    }
  }, [profile?.name, profile?.lastResetDate, missions]);

  // Helper to log activities durably
  const logActivity = async (
    type: ActivityLog["type"],
    title: string,
    points?: number,
    icon?: string
  ) => {
    const activeUser = users.find(u => u.username === session?.username) || {
      id: "system",
      name: session?.name || "Sistema",
      avatar: session?.avatar || "🤖"
    };

    const newLog: ActivityLog = {
      id: "act_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      userAvatar: activeUser.avatar,
      type,
      title,
      points: points || 0,
      icon: icon || "✨"
    };
    try {
      await setDoc(doc(db, "activityLogs", newLog.id), newLog);
    } catch (e) {
      console.error("Log activity error:", e);
    }
  };

  // User CRUD handlers
  const handleAddUser = async (newUser: Omit<ManagedUser, "id">) => {
    setSyncStatus("syncing");
    const id = "u_" + Date.now();
    const user: ManagedUser = {
      ...newUser,
      id,
      linkedUserIds: newUser.linkedUserIds || []
    };
    try {
      await setDoc(doc(db, "users", id), user);
      await logActivity("user_added", `Criou o usuário "${newUser.name}"`, 0, newUser.avatar);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleUpdateUser = async (updatedUser: ManagedUser) => {
    setSyncStatus("syncing");
    try {
      await setDoc(doc(db, "users", updatedUser.id), updatedUser);
      if (session && session.username === updatedUser.username) {
        setSession(prev => prev ? {
          ...prev,
          role: updatedUser.role,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          username: updatedUser.username
        } : null);
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setSyncStatus("syncing");
    const targetUser = users.find(u => u.id === userId);
    try {
      await deleteDoc(doc(db, "users", userId));
      if (targetUser) {
        await logActivity("user_added", `Removeu o usuário "${targetUser.name}"`, 0, targetUser.avatar);
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  // Handle subtask check/uncheck
  const handleToggleSubtask = async (missionId: string, subtaskIndex: number) => {
    setSyncStatus("syncing");
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      const updatedSubtasks = [...(mission.completedSubtasks || [])];
      updatedSubtasks[subtaskIndex] = !updatedSubtasks[subtaskIndex];
      const subtaskTitle = mission.subtasks?.[subtaskIndex] || "";
      if (updatedSubtasks[subtaskIndex]) {
        await logActivity("mission_subtask", `Completou a etapa "${subtaskTitle}" da missão "${mission.title}"`, 0, mission.icon);
      }
      const allCompleted = updatedSubtasks.every(v => v === true);
      if (allCompleted) {
        await logActivity("mission_completed", `Concluiu todas as etapas da missão "${mission.title}"! 🎉 (Aguardando aprovação)`, 0, mission.icon);
        playMissionSuccessSound();
      } else if (updatedSubtasks[subtaskIndex]) {
        playSubtaskPopSound();
      } else {
        playClickSound();
      }
      try {
        await updateDoc(doc(db, "missions", missionId), {
          completedSubtasks: updatedSubtasks,
          completed: allCompleted,
          completedAt: allCompleted ? new Date().toISOString() : null
        });
        setSyncStatus("synced");
      } catch (e) {
        setSyncStatus("error");
      }
    }
  };

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalDateStringFromISO = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  };

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Mark a mission as completed & create a pending approval request
  const handleCompleteMission = async (missionId: string) => {
    setSyncStatus("syncing");
    const mission = missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      const newApproval: ApprovalRequest = {
        id: "app_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        date: getLocalDateString(),
        missionId: mission.id,
        missionTitle: mission.title,
        missionIcon: mission.icon,
        points: mission.points,
        status: "pending"
      };
      try {
        await setDoc(doc(db, "approvals", newApproval.id), newApproval);
        await logActivity("mission_completed", `Completou a missão "${mission.title}"! 🎉 (Aguardando aprovação)`, 0, mission.icon);
        await updateDoc(doc(db, "missions", missionId), {
          completed: true,
          completedAt: new Date().toISOString(),
          completedSubtasks: mission.subtasks ? mission.subtasks.map(() => true) : []
        });
        playMissionSuccessSound();
        setSyncStatus("synced");
      } catch (e) {
        setSyncStatus("error");
      }
    }
  };

  const handleApprovePoints = async (approvalId: string) => {
    setSyncStatus("syncing");
    const req = approvals.find(a => a.id === approvalId);
    if (req && req.status === "pending") {
      try {
        await updateDoc(doc(db, "approvals", approvalId), {
          status: "approved",
          resolvedAt: new Date().toISOString()
        });
        await updateDoc(doc(db, "profiles", "bernardo"), {
          currentPoints: profile.currentPoints + req.points,
          totalPointsAllTime: profile.totalPointsAllTime + req.points
        });
        const dateStr = req.date;
        const historyItem = history.find(h => h.date === dateStr);
        if (historyItem) {
          await setDoc(doc(db, "history", dateStr), {
            date: dateStr,
            pointsEarned: (historyItem.pointsEarned || 0) + req.points,
            completedMissions: (historyItem.completedMissions || 0) + 1
          });
        } else {
          await setDoc(doc(db, "history", dateStr), {
            date: dateStr,
            pointsEarned: req.points,
            completedMissions: 1
          });
        }
        await logActivity("points_added", `Aprovou +${req.points} pts de Bernardo para a missão "${req.missionTitle}" de ${formatLocalDate(req.date)}`, req.points, req.missionIcon);
        playPointsApprovedSound();
        setSyncStatus("synced");
      } catch (e) {
        setSyncStatus("error");
      }
    }
  };

  const handleRejectPoints = async (approvalId: string) => {
    setSyncStatus("syncing");
    const req = approvals.find(a => a.id === approvalId);
    if (req && req.status === "pending") {
      try {
        await updateDoc(doc(db, "approvals", approvalId), {
          status: "rejected",
          resolvedAt: new Date().toISOString()
        });
        await updateDoc(doc(db, "missions", req.missionId), {
          completed: false,
          completedAt: null,
          completedSubtasks: missions.find(m => m.id === req.missionId)?.subtasks?.map(() => false) || []
        });
        await logActivity("points_added", `Não aprovou os pontos de "${req.missionTitle}" (${formatLocalDate(req.date)}) - Tarefa redefinida`, 0, req.missionIcon);
        setSyncStatus("synced");
      } catch (e) {
        setSyncStatus("error");
      }
    }
  };

  // Handle claiming a reward
  const handleClaimReward = async (rewardId: string, cost: number) => {
    setSyncStatus("syncing");
    if (profile.currentPoints >= cost) {
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        try {
          await updateDoc(doc(db, "profiles", "bernardo"), {
            currentPoints: profile.currentPoints - cost
          });
          await updateDoc(doc(db, "rewards", rewardId), {
            claimedCount: (reward.claimedCount || 0) + 1
          });
          const newRedemption: RedemptionLog = {
            id: "red_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            rewardId,
            rewardTitle: reward.title,
            rewardIcon: reward.icon,
            cost,
            kidName: profile.name,
            status: "pending"
          };
          await setDoc(doc(db, "redemptions", newRedemption.id), newRedemption);
          await logActivity("reward_claimed", `Resgatou o prêmio: "${reward.title}"! 🎁`, -cost, reward.icon);
          playRewardClaimedSound();
          setSyncStatus("synced");
        } catch (e) {
          setSyncStatus("error");
        }
      }
    }
  };

  // Parent panel actions: Add, edit, delete missions
  const handleAddMission = async (newMission: Omit<Mission, "id" | "completed" | "completedSubtasks">) => {
    setSyncStatus("syncing");
    const id = "m_" + Date.now();
    const mission: Mission = {
      ...newMission,
      id,
      completed: false,
      completedSubtasks: newMission.subtasks?.map(() => false) || [],
      createdBy: session?.role === "mae" ? "mae" : session?.role === "pai" ? "pai" : "default"
    };
    try {
      await setDoc(doc(db, "missions", id), mission);
      await logActivity("mission_added", `Cadastrou nova missão: "${newMission.title}"`, newMission.points, newMission.icon);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleUpdateMission = async (updatedMission: Mission) => {
    setSyncStatus("syncing");
    try {
      await setDoc(doc(db, "missions", updatedMission.id), updatedMission);
      await logActivity("mission_added", `Atualizou a missão: "${updatedMission.title}"`, updatedMission.points, updatedMission.icon);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    setSyncStatus("syncing");
    const targetMission = missions.find(m => m.id === missionId);
    try {
      await deleteDoc(doc(db, "missions", missionId));
      if (targetMission) {
        await logActivity("mission_added", `Removeu a missão: "${targetMission.title}"`, 0, targetMission.icon);
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  // Parent panel actions: Add, edit, delete rewards
  const handleAddReward = async (newReward: Omit<Reward, "id" | "claimedCount">) => {
    setSyncStatus("syncing");
    const id = "r_" + Date.now();
    const reward: Reward = {
      ...newReward,
      id,
      claimedCount: 0,
      createdBy: session?.role === "mae" ? "mae" : session?.role === "pai" ? "pai" : "default"
    };
    try {
      await setDoc(doc(db, "rewards", id), reward);
      await logActivity("reward_added", `Cadastrou novo prêmio: "${newReward.title}"`, -newReward.cost, newReward.icon);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleUpdateReward = async (updatedReward: Reward) => {
    setSyncStatus("syncing");
    try {
      await setDoc(doc(db, "rewards", updatedReward.id), updatedReward);
      await logActivity("reward_added", `Atualizou o prêmio: "${updatedReward.title}"`, -updatedReward.cost, updatedReward.icon);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    setSyncStatus("syncing");
    const targetReward = rewards.find(r => r.id === rewardId);
    try {
      await deleteDoc(doc(db, "rewards", rewardId));
      if (targetReward) {
        await logActivity("reward_added", `Removeu o prêmio: "${targetReward.title}"`, 0, targetReward.icon);
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleResetMissions = async () => {
    if (!isParent) {
      alert("Apenas pais/responsáveis podem realizar esta ação.");
      return;
    }
    setSyncStatus("syncing");
    try {
      const promises = missions.map(m => {
        const updateData: any = { completed: false };
        if (m.subtasks && m.subtasks.length > 0) {
          updateData.completedSubtasks = m.subtasks.map(() => false);
        } else {
          updateData.completedSubtasks = [];
        }
        return updateDoc(doc(db, "missions", m.id), updateData);
      });
      await Promise.all(promises);
      await logActivity("points_added", "Resetou o progresso de todas as missões diárias.", 0, "🔄");
      setSyncStatus("synced");
    } catch (e) {
      console.error("Error resetting missions:", e);
      setSyncStatus("error");
    }
  };

  const handleRestoreDefaultMissions = async () => {
    if (!isParent) {
      alert("Apenas pais/responsáveis podem realizar esta ação.");
      return;
    }
    setSyncStatus("syncing");
    try {
      // 1. Fetch and delete all current missions in Firestore
      const missionsSnap = await getDocs(collection(db, "missions"));
      const deletePromises = missionsSnap.docs.map(d => deleteDoc(doc(db, "missions", d.id)));
      await Promise.all(deletePromises);

      // 2. Seed default missions
      const seedPromises = DEFAULT_MISSIONS.map(m => setDoc(doc(db, "missions", m.id), m));
      await Promise.all(seedPromises);

      await logActivity("points_added", "Restaurou todas as missões diárias para o padrão de fábrica. 🛠️🔄", 0, "🔄");
      setSyncStatus("synced");
    } catch (e) {
      console.error("Error restoring default missions:", e);
      setSyncStatus("error");
    }
  };

  const handleUpdateKidProfile = async (updates: Partial<KidProfile>) => {
    if (!isParent) {
      alert("Apenas pais/responsáveis podem alterar ou zerar a pontuação de Bernardo.");
      return;
    }
    setSyncStatus("syncing");
    try {
      await updateDoc(doc(db, "profiles", "bernardo"), updates);
      
      // If parent is resetting the points to 0, let's also clean up history/approvals/redemptions to start fully fresh!
      if (updates.totalPointsAllTime === 0) {
        // Clear history documents
        const historySnap = await getDocs(collection(db, "history"));
        const p1 = historySnap.docs.map(d => deleteDoc(doc(db, "history", d.id)));

        // Clear approvals
        const approvalSnap = await getDocs(collection(db, "approvals"));
        const p2 = approvalSnap.docs.map(d => deleteDoc(doc(db, "approvals", d.id)));

        // Clear redemptions
        const redemptionSnap = await getDocs(collection(db, "redemptions"));
        const p3 = redemptionSnap.docs.map(d => deleteDoc(doc(db, "redemptions", d.id)));

        // Wait for all deletions
        await Promise.all([...p1, ...p2, ...p3]);
        
        await logActivity("points_added", "Zerou toda a pontuação, histórico e solicitações de Bernardo para início oficial! 🔄✨", 0, "🔄");
      } else {
        await logActivity("points_added", `Atualizou o perfil de Bernardo: ${updates.name || ""}`, 0, updates.avatar || "🧑‍🚀");
      }
      
      setSyncStatus("synced");
    } catch (e) {
      console.error("Error updating kid profile:", e);
      setSyncStatus("error");
    }
  };

  const handleRecalculatePointsFromHistory = async () => {
    if (!isParent) {
      alert("Apenas pais/responsáveis podem recalcular os pontos.");
      return;
    }
    setSyncStatus("syncing");
    try {
      const approvalSnap = await getDocs(collection(db, "approvals"));
      let approvedPoints = 0;
      let countApproved = 0;
      approvalSnap.forEach(d => {
        const data = d.data();
        if (data.status === "approved") {
          approvedPoints += (data.points || 0);
          countApproved++;
        }
      });

      const redemptionsSnap = await getDocs(collection(db, "redemptions"));
      let totalRedeemed = 0;
      redemptionsSnap.forEach(d => {
        const data = d.data();
        if (data.status !== "rejected") {
          totalRedeemed += (data.cost || 0);
        }
      });

      const netCurrentPoints = Math.max(0, approvedPoints - totalRedeemed);
      const totalAllTime = approvedPoints;

      await updateDoc(doc(db, "profiles", "bernardo"), {
        currentPoints: netCurrentPoints,
        totalPointsAllTime: totalAllTime
      });

      await logActivity(
        "points_added",
        `Sincronizou e recalculou a pontuação de Bernardo com base no histórico (${countApproved} tarefas aprovadas = ${netCurrentPoints} pts)! 🛡️✨`,
        0,
        "🔄"
      );
      setSyncStatus("synced");
      alert(`Pontuação sincronizada com sucesso!\n\nEncontradas ${countApproved} missões aprovadas.\nTotal acumulado: ${totalAllTime} pts.\nSaldo atual disponível: ${netCurrentPoints} pts.`);
    } catch (e) {
      console.error("Erro ao recalcular pontos:", e);
      setSyncStatus("error");
      alert("Erro ao recalcular pontos. Verifique a conexão.");
    }
  };

  const handleClaimTabletBonus = async () => {
    setSyncStatus("syncing");
    try {
      await updateDoc(doc(db, "profiles", "bernardo"), {
        currentPoints: profile.currentPoints + 10,
        totalPointsAllTime: profile.totalPointsAllTime + 10,
        tabletBonusClaimedDate: getLocalDateString()
      });
      await logActivity("points_added", `Resgatou o bônus de +10 pts do Tablet Diário por atingir super meta! 📱✨`, 10, "🎁");
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleUpdateRedemptionStatus = async (redemptionId: string, status: "pending" | "delivered" | "rejected") => {
    setSyncStatus("syncing");
    try {
      await updateDoc(doc(db, "redemptions", redemptionId), {
        status,
        deliveredAt: status === "delivered" ? new Date().toISOString() : null,
        resolvedAt: status === "rejected" ? new Date().toISOString() : null
      });
      const r = redemptions.find(x => x.id === redemptionId);
      if (r) {
        if (status === "rejected") {
          // Refund points to child profile
          await updateDoc(doc(db, "profiles", "bernardo"), {
            currentPoints: profile.currentPoints + r.cost
          });

          // Decrement claimed count
          const reward = rewards.find(x => x.id === r.rewardId);
          if (reward) {
            await updateDoc(doc(db, "rewards", r.rewardId), {
              claimedCount: Math.max(0, (reward.claimedCount || 0) - 1)
            });
          }
        }

        let statusText = "Pendente";
        if (status === "delivered") statusText = "Entregue";
        if (status === "rejected") statusText = "Recusado (Pontos Devolvidos)";

        await logActivity(
          "redemption_status",
          status === "rejected"
            ? `Recusou o prêmio "${r.rewardTitle}" (Pontos devolvidos: +${r.cost} pts)`
            : `Marcou o prêmio "${r.rewardTitle}" como ${statusText}`,
          status === "rejected" ? r.cost : 0,
          r.rewardIcon
        );
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  const handleClearLogs = async () => {
    setSyncStatus("syncing");
    try {
      const p1 = activityLogs.map(log => deleteDoc(doc(db, "activityLogs", log.id)));
      const p2 = redemptions.map(red => deleteDoc(doc(db, "redemptions", red.id)));
      await Promise.all([...p1, ...p2]);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    }
  };

  // Security gate for parent tab
  const handleTabClick = (tab: typeof activeTab) => {
    playClickSound();
    if (tab === "pais" && !isParent) {
      setActiveTab("hoje");
    } else {
      setActiveTab(tab);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3eae1] via-[#faf6f0] to-[#e6eaf3] flex justify-center items-start py-0 md:py-8" id="app-root">
        {/* Centered responsive tablet container */}
        <div className="w-full max-w-[480px] md:max-w-[720px] lg:max-w-[800px] min-h-screen md:min-h-[850px] md:rounded-2xl bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 border border-outline-variant/15 overflow-hidden transition-all duration-300">
          <LoginScreen users={users} onLogin={(userSession) => {
            setSession(userSession);
            // If child logs in, default to "hoje" tab
            if (userSession.role === "kid") {
              setActiveTab("hoje");
            } else {
              // If parent logs in, direct them straight to parents panel
              setActiveTab("pais");
            }
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3eae1] via-[#faf6f0] to-[#e6eaf3] flex justify-center items-start py-0 md:py-8" id="app-root">
      {/* Centered responsive tablet container */}
      <div className="w-full max-w-[480px] md:max-w-[720px] lg:max-w-[800px] min-h-screen md:min-h-[850px] md:rounded-2xl bg-background shadow-2xl relative flex flex-col pb-28 border border-outline-variant/15 overflow-hidden transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 bg-background z-30 px-6 py-4 flex justify-between items-center border-b border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/15">
              <Target className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="font-bold text-base text-primary tracking-tight leading-none">
                Focus Kids
              </h1>
              <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-wider">
                Rotina, Foco e Incentivo 🚀
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud sync status indicator */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              syncStatus === "synced"
                ? "bg-green-50 text-green-600 border border-green-200"
                : syncStatus === "syncing"
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {syncStatus === "synced" && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span className="hidden xs:inline">Nuvem Sincronizada</span>
                </>
              )}
              {syncStatus === "syncing" && (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                  <span className="hidden xs:inline">Salvando...</span>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="hidden xs:inline">Erro de Sync</span>
                </>
              )}
            </div>

            {/* User identification and switch account trigger */}
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full text-primary text-xs font-bold border border-primary/20">
              <span className="text-sm shrink-0">{session.avatar}</span>
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
                {session.role === "kid" ? "Bernardo" : session.name}
              </span>
            </div>

            <button
              onClick={() => {
                setSession(null);
                setActiveTab("hoje");
              }}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs p-2 rounded-full flex items-center justify-center font-bold transition-all"
              title="Trocar de Conta / Sair"
            >
              <LogOut className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
        </header>

        {/* Content body with responsive transition */}
        <main className="flex-1 px-6 py-5 overflow-y-auto">
          {activeTab === "hoje" && (
            <KidDashboard
              missions={missions}
              profile={profile}
              onToggleSubtask={handleToggleSubtask}
              onCompleteMission={handleCompleteMission}
              onClaimPoints={(pts) => setProfile(prev => ({ ...prev, currentPoints: prev.currentPoints + pts }))}
              approvals={approvals}
              onClaimTabletBonus={handleClaimTabletBonus}
            />
          )}

          {activeTab === "recompensas" && (
            <RewardStore
              rewards={rewards}
              profile={profile}
              onClaimReward={handleClaimReward}
            />
          )}

          {activeTab === "progresso" && (
            <ProgressReport
              missions={missions}
              profile={profile}
              history={history}
              activityLogs={activityLogs}
              redemptions={redemptions}
            />
          )}

          {activeTab === "pais" && isParent && (
            <ParentPanel
              missions={missions}
              rewards={rewards}
              profile={profile}
              onAddMission={handleAddMission}
              onUpdateMission={handleUpdateMission}
              onDeleteMission={handleDeleteMission}
              onAddReward={handleAddReward}
              onUpdateReward={handleUpdateReward}
              onDeleteReward={handleDeleteReward}
              onResetMissions={handleResetMissions}
              onRestoreDefaultMissions={handleRestoreDefaultMissions}
              onUpdateKidProfile={handleUpdateKidProfile}
              users={users}
              session={session}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              activityLogs={activityLogs}
              redemptions={redemptions}
              onUpdateRedemptionStatus={handleUpdateRedemptionStatus}
              onClearLogs={handleClearLogs}
              approvals={approvals}
              onApprovePoints={handleApprovePoints}
              onRejectPoints={handleRejectPoints}
              onRecalculatePointsFromHistory={handleRecalculatePointsFromHistory}
            />
          )}
        </main>

        {/* Bottom Navigation with highly polished active tabs */}
        <nav className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 px-4 py-2.5 flex justify-around items-center z-30 shadow-[0_-4px_24px_rgba(0,96,172,0.05)] md:rounded-b-2xl">
          <button
            onClick={() => handleTabClick("hoje")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "hoje"
                ? "text-primary scale-105 font-bold"
                : "text-on-surface-variant/70 hover:text-on-surface"
            }`}
          >
            <TodayIcon active={activeTab === "hoje"} />
            <span className="text-[11px] font-label-lg leading-none">Hoje</span>
          </button>

          <button
            onClick={() => handleTabClick("recompensas")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "recompensas"
                ? "text-tertiary scale-105 font-bold"
                : "text-on-surface-variant/70 hover:text-on-surface"
            }`}
          >
            <RecompensasIcon active={activeTab === "recompensas"} />
            <span className="text-[11px] font-label-lg leading-none">Prêmios</span>
          </button>

          <button
            onClick={() => handleTabClick("progresso")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "progresso"
                ? "text-secondary scale-105 font-bold"
                : "text-on-surface-variant/70 hover:text-on-surface"
            }`}
          >
            <ProgressoIcon active={activeTab === "progresso"} />
            <span className="text-[11px] font-label-lg leading-none">Evolução</span>
          </button>

          {isParent && (
            <button
              onClick={() => handleTabClick("pais")}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                activeTab === "pais"
                  ? "text-primary scale-105 font-bold"
                  : "text-on-surface-variant/70 hover:text-on-surface"
              }`}
            >
              <PaisIcon active={activeTab === "pais"} />
              <span className="text-[11px] font-label-lg leading-none">Pais</span>
            </button>
          )}
        </nav>

      </div>
    </div>
  );
}
