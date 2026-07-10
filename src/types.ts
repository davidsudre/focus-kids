export type Period = 'manha' | 'tarde' | 'noite';

export interface UserSession {
  role: 'pai' | 'mae' | 'kid';
  name: string;
  avatar: string;
  username: string; // The login username
  partnerName?: string; // name of other parent to show unified collaboration
}

export interface ManagedUser {
  id: string;
  username: string;
  email?: string;
  password?: string;
  name: string;
  role: 'pai' | 'mae' | 'kid';
  avatar: string;
  linkedUserIds?: string[]; // IDs of other users linked to this one (e.g., parents linked to kids, kids linked to parents)
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  period: Period;
  points: number;
  icon: string;
  completed: boolean;
  completedAt?: string;
  subtasks?: string[];
  completedSubtasks?: boolean[]; // tracks completion of subtasks
  createdBy?: 'pai' | 'mae' | 'default';
  isEssential?: boolean; // Mark if this is an essential task for daily tablet unlock
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  claimedCount: number;
  createdBy?: 'pai' | 'mae' | 'default';
  periodicity?: 'diario' | 'semanal' | 'mensal' | 'quinzenal' | 'unico';
}

export interface DailyStats {
  date: string;
  pointsEarned: number;
  completedMissions: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'mission_subtask' | 'mission_completed' | 'reward_claimed' | 'points_added' | 'user_added' | 'mission_added' | 'reward_added' | 'redemption_status';
  title: string;
  points?: number;
  icon?: string;
}

export interface RedemptionLog {
  id: string;
  timestamp: string;
  rewardId: string;
  rewardTitle: string;
  rewardIcon: string;
  cost: number;
  kidName: string;
  status: 'pending' | 'delivered' | 'rejected';
  deliveredAt?: string;
}

export interface ApprovalRequest {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  missionId: string;
  missionTitle: string;
  missionIcon: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
}

export interface KidProfile {
  name: string;
  currentPoints: number;
  streak: number;
  totalPointsAllTime: number;
  avatar: string;
  tabletBonusClaimedDate?: string; // YYYY-MM-DD to track daily bonus claims
  lastResetDate?: string; // YYYY-MM-DD to track daily auto-resets of missions
}

export interface AppSettings {
  autoResetDaily: boolean;
  kidName: string;
  pinCode: string; // pin code to access parent's settings if desired
}
