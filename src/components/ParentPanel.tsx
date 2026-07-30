import React, { useState, useEffect } from "react";
import { Mission, Reward, Period, KidProfile, ManagedUser, UserSession, ActivityLog, RedemptionLog, ApprovalRequest } from "../types";
import { Plus, Edit3, Trash2, Sparkles, Check, HelpCircle, Save, X, RotateCcw, AlertTriangle, Key, UserPlus, Users, Link, Gift, ClipboardList, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ParentPanelProps {
  missions: Mission[];
  rewards: Reward[];
  profile: KidProfile;
  onAddMission: (mission: Omit<Mission, "id" | "completed" | "completedSubtasks">) => void;
  onUpdateMission: (mission: Mission) => void;
  onDeleteMission: (missionId: string) => void;
  onAddReward: (reward: Omit<Reward, "id" | "claimedCount">) => void;
  onUpdateReward: (reward: Reward) => void;
  onDeleteReward: (rewardId: string) => void;
  onResetMissions: () => void;
  onRestoreDefaultMissions: () => void;
  onUpdateKidProfile: (updates: Partial<KidProfile>) => void;
  users: ManagedUser[];
  session: UserSession;
  onAddUser: (user: Omit<ManagedUser, "id">) => void;
  onUpdateUser: (user: ManagedUser) => void;
  onDeleteUser: (userId: string) => void;
  activityLogs: ActivityLog[];
  redemptions: RedemptionLog[];
  onUpdateRedemptionStatus: (id: string, status: "pending" | "delivered" | "rejected") => void;
  onClearLogs?: () => void;
  approvals?: ApprovalRequest[];
  onApprovePoints?: (id: string) => void;
  onRejectPoints?: (id: string) => void;
}

const formatSwedishDateToPtBr = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yDay = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    if (dateStr === todayStr) {
      return "Hoje 📅";
    } else if (dateStr === yesterdayStr) {
      return "Ontem 📅";
    } else {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

export default function ParentPanel({
  missions,
  rewards,
  profile,
  onAddMission,
  onUpdateMission,
  onDeleteMission,
  onAddReward,
  onUpdateReward,
  onDeleteReward,
  onResetMissions,
  onRestoreDefaultMissions,
  onUpdateKidProfile,
  users,
  session,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  activityLogs,
  redemptions,
  onUpdateRedemptionStatus,
  onClearLogs,
  approvals = [],
  onApprovePoints,
  onRejectPoints
}: ParentPanelProps) {
  // Navigation inside parent panel: "missions" | "rewards" | "settings" | "users" | "logs"
  const isDavidRoot = session.username === "davidsudre";
  const [activeSubTab, setActiveSubTab] = useState<"missions" | "rewards" | "settings" | "users" | "logs">("missions");

  // Tablet unlock system logic for Parent View
  const completedMissionsToday = missions.filter(m => m.completed);
  const pointsEarnedToday = completedMissionsToday.reduce((sum, m) => sum + m.points, 0);

  const essentialMissions = missions.filter(m => m.isEssential);
  const allEssentialsCompleted = essentialMissions.length === 0 || essentialMissions.every(m => m.completed);

  let tabletMinutes = 0;
  if (pointsEarnedToday >= 80 && pointsEarnedToday <= 109) {
    tabletMinutes = 30;
  } else if (pointsEarnedToday >= 110 && pointsEarnedToday <= 129) {
    tabletMinutes = 60;
  } else if (pointsEarnedToday >= 130) {
    tabletMinutes = 90;
  }

  const isTabletUnlocked = pointsEarnedToday >= 80 && allEssentialsCompleted;

  // Mission Form States
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionPeriod, setMissionPeriod] = useState<Period>("manha");
  const [missionPoints, setMissionPoints] = useState(10);
  const [missionIcon, setMissionIcon] = useState("✨");
  const [missionIsEssential, setMissionIsEssential] = useState(false);
  const [missionSubtasks, setMissionSubtasks] = useState<string[]>(["", "", ""]);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Reward Form States
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardCost, setRewardCost] = useState(50);
  const [rewardIcon, setRewardIcon] = useState("🎁");
  const [rewardPeriodicity, setRewardPeriodicity] = useState<'diario' | 'semanal' | 'mensal' | 'quinzenal' | 'unico'>("diario");

  // User Form States (David Root features)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userUsername, setUserUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("1234");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<'pai' | 'mae' | 'kid'>("pai");
  const [userAvatar, setUserAvatar] = useState("👨‍💼");
  const [userLinkedIds, setUserLinkedIds] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Kid profile modification states
  const [kidName, setKidName] = useState(profile.name);
  const [kidAvatar, setKidAvatar] = useState(profile.avatar);
  const [kidCurrentPoints, setKidCurrentPoints] = useState(profile.currentPoints ?? 0);
  const [kidTotalPointsAllTime, setKidTotalPointsAllTime] = useState(profile.totalPointsAllTime ?? 0);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Sync states if profile prop updates
  useEffect(() => {
    setKidName(profile.name);
    setKidAvatar(profile.avatar);
    setKidCurrentPoints(profile.currentPoints ?? 0);
    setKidTotalPointsAllTime(profile.totalPointsAllTime ?? 0);
  }, [profile]);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetPointsConfirm, setShowResetPointsConfirm] = useState(false);
  const [showRestoreMissionsConfirm, setShowRestoreMissionsConfirm] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Open modal for new mission
  const openNewMissionModal = () => {
    setEditingMission(null);
    setMissionTitle("");
    setMissionDescription("");
    setMissionPeriod("manha");
    setMissionPoints(15);
    setMissionIcon("✨");
    setMissionIsEssential(false);
    setMissionSubtasks(["", ""]);
    setAiFeedback(null);
    setIsMissionModalOpen(true);
  };

  // Open modal for editing mission
  const openEditMissionModal = (mission: Mission) => {
    setEditingMission(mission);
    setMissionTitle(mission.title);
    setMissionDescription(mission.description);
    setMissionPeriod(mission.period);
    setMissionPoints(mission.points);
    setMissionIcon(mission.icon);
    setMissionIsEssential(!!mission.isEssential);
    setMissionSubtasks(mission.subtasks || ["", ""]);
    setAiFeedback(null);
    setIsMissionModalOpen(true);
  };

  // Call server-side Gemini AI to break down a task
  const handleAIBreakdown = async () => {
    if (!missionTitle.trim()) {
      alert("Por favor, digite o título da atividade primeiro!");
      return;
    }

    setIsGeneratingWithAI(true);
    setAiFeedback("Consultando inteligência Focus Kids...");

    const getSmartFallbackFrontend = (originalTask: string) => {
      const taskLower = originalTask.toLowerCase();

      // 1. Breakfast / Meals
      if (
        taskLower.includes("café") ||
        taskLower.includes("cafe") ||
        taskLower.includes("comer") ||
        taskLower.includes("almoç") ||
        taskLower.includes("almoc") ||
        taskLower.includes("jantar") ||
        taskLower.includes("lanche") ||
        taskLower.includes("comida") ||
        taskLower.includes("aliment")
      ) {
        return {
          title: "Super Missão: Refeição Saudável 🍳",
          description: "Abasteça seu corpo com energia de verdade para se divertir muito!",
          subtasks: [
            "Pegar o prato, copo e talheres com cuidado",
            "Escolher alimentos saudáveis e nutritivos para colocar na mesa",
            "Sentar e comer devagar, aproveitando a refeição com atenção",
            "Levar a louça para a pia e passar um pano na mesa"
          ],
          recommendedPoints: 15,
          recommendedEmoji: "🍳"
        };
      }

      // 2. Hygiene / Teeth / Bath
      if (
        taskLower.includes("dente") ||
        taskLower.includes("escovar") ||
        taskLower.includes("banho") ||
        taskLower.includes("lavar") ||
        taskLower.includes("pentear") ||
        taskLower.includes("fio dental") ||
        taskLower.includes("higiene")
      ) {
        const isBath = taskLower.includes("banho") || taskLower.includes("chuveiro");
        return {
          title: isBath ? "Ritual do Banho Refrescante 🧼" : "Operação Sorriso de Super-Herói 🪥",
          description: isBath ? "Hora de relaxar, tirar a sujeira do dia e ficar super cheiroso!" : "Mantenha seus dentes fortes, brilhantes e livres de monstrinhos!",
          subtasks: isBath ? [
            "Preparar a toalha e a roupa limpa antes de ligar o chuveiro",
            "Lavar todo o corpo e o cabelo com sabonete e shampoo",
            "Se secar muito bem com a toalha ao sair",
            "Colocar as roupas sujas no cesto e estender a toalha"
          ] : [
            "Colocar a quantidade certa de pasta (do tamanho de uma ervilha)",
            "Escovar todos os dentes (frente, trás e mastigação) por 2 minutos",
            "Escovar a língua com delicadeza e enxaguar bem a boca",
            "Lavar a escova, secar o rosto e guardar tudo no lugar"
          ],
          recommendedPoints: 12,
          recommendedEmoji: isBath ? "🧼" : "🪥"
        };
      }

      // 3. Room cleanup / Bed / Toys / Clothes
      if (
        taskLower.includes("quarto") ||
        taskLower.includes("arrumar") ||
        taskLower.includes("organizar") ||
        taskLower.includes("cama") ||
        taskLower.includes("brinquedo") ||
        taskLower.includes("guardar") ||
        taskLower.includes("limpar") ||
        taskLower.includes("roupa")
      ) {
        const isBed = taskLower.includes("cama");
        return {
          title: isBed ? "Missão Cama Perfeita 🛏️" : "Quartel-General Organizado 🧹",
          description: isBed ? "Esticar o lençol deixa o quarto lindo e pronto para um bom sono!" : "Um espaço organizado ajuda seu cérebro a pensar melhor e achar tudo rápido!",
          subtasks: isBed ? [
            "Retirar travesseiros e bichinhos de pelúcia da cama",
            "Esticar bem o lençol de baixo para tirar todas as dobras",
            "Esticar o edredom ou cobertor por cima de forma alinhada",
            "Colocar o travesseiro de volta no topo com capricho"
          ] : [
            "Juntar e guardar todos os brinquedos nas caixas corretas",
            "Organizar os livros na estante ou mesinha de estudos",
            "Recolher roupas espalhadas e colocar no cesto de roupa suja",
            "Dar uma olhada geral para ver se o chão ficou 100% livre"
          ],
          recommendedPoints: 15,
          recommendedEmoji: isBed ? "🛏️" : "🧹"
        };
      }

      // 4. Homework / Studying / School / Backpack
      if (
        taskLower.includes("lição") ||
        taskLower.includes("licao") ||
        taskLower.includes("dever") ||
        taskLower.includes("estudar") ||
        taskLower.includes("escola") ||
        taskLower.includes("mochila") ||
        taskLower.includes("caderno") ||
        taskLower.includes("livro") ||
        taskLower.includes("ler") ||
        taskLower.includes("tema") ||
        taskLower.includes("aula") ||
        taskLower.includes("matemática") ||
        taskLower.includes("português")
      ) {
        const isBackpack = taskLower.includes("mochila") || taskLower.includes("escola");
        return {
          title: isBackpack ? "Missão Mochila Pronta 🎒" : "Desafio do Cérebro Ativo 📚",
          description: isBackpack ? "Deixe tudo preparado hoje para sua jornada escolar de amanhã ser incrível!" : "Treine sua mente focando em uma coisa de cada vez para aprender super rápido!",
          subtasks: isBackpack ? [
            "Conferir no estojo se lápis, borracha e canetas estão completos",
            "Olhar o cronograma de aulas e selecionar os livros e cadernos corretos",
            "Colocar a garrafa de água cheia e o lanche na mochila",
            "Fechar todos os zíperes e deixar a mochila perto da porta"
          ] : [
            "Organizar o estojo, caderno e materiais em uma mesa limpa",
            "Desligar as telas (TV, tablet, celular) e evitar distrações",
            "Ler as instruções com calma e responder cada questão com atenção",
            "Revisar o que fez e guardar o material na mochila escolar"
          ],
          recommendedPoints: 20,
          recommendedEmoji: isBackpack ? "🎒" : "📚"
        };
      }

      // 5. Electronics / Screens / Tablet / Video Game / Phone
      if (
        taskLower.includes("celular") ||
        taskLower.includes("tablet") ||
        taskLower.includes("tela") ||
        taskLower.includes("videogame") ||
        taskLower.includes("computador") ||
        taskLower.includes("tv") ||
        taskLower.includes("jogo") ||
        taskLower.includes("jogar") ||
        taskLower.includes("eletronic") ||
        taskLower.includes("playstation") ||
        taskLower.includes("nintendo") ||
        taskLower.includes("xbox")
      ) {
        return {
          title: "Desafio da Conexão Saudável 📱",
          description: "Aproveite o mundo digital com inteligência, postura e foco total!",
          subtasks: [
            "Definir um alarme com o tempo combinado de tela com os pais",
            "Manter a coluna reta e uma distância saudável de pelo menos um braço da tela",
            "Desligar o aparelho imediatamente assim que o alarme tocar, sem reclamar",
            "Fazer 5 minutos de alongamento ou olhar pela janela para descansar os olhos"
          ],
          recommendedPoints: 12,
          recommendedEmoji: "📱"
        };
      }

      // 6. Generic Fallback
      const formattedTitle = originalTask.length > 30 ? originalTask.substring(0, 27) + "..." : originalTask;
      return {
        title: `Desafio: ${formattedTitle} ✨`,
        description: "Vamos realizar essa atividade de forma divertida, um passo de cada vez!",
        subtasks: [
          "Preparar todos os materiais necessários para a tarefa",
          "Iniciar a primeira etapa com atenção total e sem pressa",
          "Revisar se tudo foi concluído com cuidado e capricho",
          "Organizar o espaço de volta e comemorar os pontos obtidos!"
        ],
        recommendedPoints: 15,
        recommendedEmoji: "✨"
      };
    };

    try {
      // Resolve correct API URL. Relative path works universally in development, Cloud Run preview, and on Vercel deployment.
      let apiUrl = "/api/copilot/task-breakdown";
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv.VITE_API_URL) {
        apiUrl = `${metaEnv.VITE_API_URL}/api/copilot/task-breakdown`;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalTask: missionTitle }),
      });

      if (!response.ok) {
        throw new Error("Erro na resposta do servidor.");
      }

      const data = await response.json();

      // Automatically populate fields
      setMissionTitle(data.title || missionTitle);
      setMissionDescription(data.description || "Atividade saudável para nossa rotina!");
      setMissionPoints(data.recommendedPoints || 15);
      setMissionIcon(data.recommendedEmoji || "✨");
      setMissionSubtasks(data.subtasks && data.subtasks.length > 0 ? data.subtasks : ["", ""]);

      if (data.isFallback) {
        if (data.apiKeyMissing) {
          setAiFeedback("ℹ️ Chave do Gemini indisponível. Usamos o Copiloto Inteligente integrado!");
        } else {
          setAiFeedback("ℹ️ Servidor de IA indisponível ou lento. Usamos o Copiloto Inteligente integrado!");
        }
      } else {
        setAiFeedback("✨ Inteligência Focus Kids dividiu a tarefa com sucesso!");
      }
    } catch (error) {
      console.error(error);
      const fallback = getSmartFallbackFrontend(missionTitle);
      setMissionTitle(fallback.title);
      setMissionDescription(fallback.description);
      setMissionSubtasks(fallback.subtasks);
      setMissionPoints(fallback.recommendedPoints);
      setMissionIcon(fallback.recommendedEmoji);
      setAiFeedback("⚠️ Erro de conexão com a IA. Usamos o Copiloto Inteligente integrado!");
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleSaveMission = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty subtasks
    const cleanSubtasks = missionSubtasks.filter(st => st.trim() !== "");
    if (cleanSubtasks.length === 0) {
      alert("Por favor, adicione pelo menos uma micro-etapa para a criança!");
      return;
    }

    if (editingMission) {
      onUpdateMission({
        ...editingMission,
        title: missionTitle,
        description: missionDescription,
        period: missionPeriod,
        points: missionPoints,
        icon: missionIcon,
        isEssential: missionIsEssential,
        subtasks: cleanSubtasks,
        completedSubtasks: cleanSubtasks.map((_, i) =>
          i < (editingMission.completedSubtasks?.length || 0)
            ? editingMission.completedSubtasks![i]
            : false
        )
      });
    } else {
      onAddMission({
        title: missionTitle,
        description: missionDescription,
        period: missionPeriod,
        points: missionPoints,
        icon: missionIcon,
        isEssential: missionIsEssential,
        subtasks: cleanSubtasks,
      });
    }
    setIsMissionModalOpen(false);
  };

  const handleSubtaskTextChange = (idx: number, val: string) => {
    const updated = [...missionSubtasks];
    updated[idx] = val;
    setMissionSubtasks(updated);
  };

  const addSubtaskLine = () => {
    setMissionSubtasks([...missionSubtasks, ""]);
  };

  const removeSubtaskLine = (idx: number) => {
    if (missionSubtasks.length > 1) {
      const updated = missionSubtasks.filter((_, i) => i !== idx);
      setMissionSubtasks(updated);
    }
  };

  // Rewards Actions
  const openNewRewardModal = () => {
    setEditingReward(null);
    setRewardTitle("");
    setRewardCost(50);
    setRewardIcon("🎁");
    setRewardPeriodicity("diario");
    setIsRewardModalOpen(true);
  };

  const openEditRewardModal = (reward: Reward) => {
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardCost(reward.cost);
    setRewardIcon(reward.icon);
    setRewardPeriodicity(reward.periodicity || "diario");
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) return;

    if (editingReward) {
      onUpdateReward({
        ...editingReward,
        title: rewardTitle,
        cost: rewardCost,
        icon: rewardIcon,
        periodicity: rewardPeriodicity
      });
    } else {
      onAddReward({
        title: rewardTitle,
        cost: rewardCost,
        icon: rewardIcon,
        periodicity: rewardPeriodicity
      });
    }
    setIsRewardModalOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateKidProfile({
      name: kidName,
      avatar: kidAvatar,
      currentPoints: Number(kidCurrentPoints) || 0,
      totalPointsAllTime: Number(kidTotalPointsAllTime) || 0
    });
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setProfileSaveSuccess(false);
    }, 3000);
  };

  // User CRUD helper functions (David Root only)
  const openNewUserModal = () => {
    setEditingUser(null);
    setUserUsername("");
    setUserEmail("");
    setUserPassword("1234");
    setUserName("");
    setUserRole("pai");
    setUserAvatar("👨‍💼");
    setUserLinkedIds([]);
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: ManagedUser) => {
    setEditingUser(user);
    setUserUsername(user.username);
    setUserEmail(user.email || "");
    setUserPassword(user.password || "1234");
    setUserName(user.name);
    setUserRole(user.role);
    setUserAvatar(user.avatar);
    setUserLinkedIds(user.linkedUserIds || []);
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUsername.trim() || !userName.trim()) {
      setUserFormError("Por favor, preencha todos os campos!");
      return;
    }

    const cleanUsername = userUsername.trim().toLowerCase();

    // Check duplicate usernames
    const duplicate = users.find(
      u => u.username.toLowerCase() === cleanUsername && (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      setUserFormError(`O usuário "${cleanUsername}" já existe! Escolha outro nome de usuário.`);
      return;
    }

    if (editingUser) {
      // Prepare updated user
      const updated: ManagedUser = {
        ...editingUser,
        username: cleanUsername,
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        name: userName,
        role: userRole,
        avatar: userAvatar,
        linkedUserIds: userLinkedIds
      };
      onUpdateUser(updated);

      // Bidirectionally update all other users so that links are synchronized
      users.forEach(other => {
        const isCurrentlyLinked = other.linkedUserIds?.includes(editingUser.id);
        const shouldBeLinked = userLinkedIds.includes(other.id);
        
        if (isCurrentlyLinked && !shouldBeLinked) {
          onUpdateUser({
            ...other,
            linkedUserIds: other.linkedUserIds?.filter(id => id !== editingUser.id) || []
          });
        } else if (!isCurrentlyLinked && shouldBeLinked) {
          onUpdateUser({
            ...other,
            linkedUserIds: [...(other.linkedUserIds || []), editingUser.id]
          });
        }
      });
    } else {
      // For creating a new user
      const tempId = "u_" + Date.now();
      onAddUser({
        username: cleanUsername,
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        name: userName,
        role: userRole,
        avatar: userAvatar,
        linkedUserIds: userLinkedIds
      });

      // Update linked users bidirectionally
      userLinkedIds.forEach(id => {
        const other = users.find(u => u.id === id);
        if (other) {
          onUpdateUser({
            ...other,
            linkedUserIds: [...(other.linkedUserIds || []), tempId]
          });
        }
      });
    }

    setIsUserModalOpen(false);
  };

  const handleToggleUserLink = (targetId: string) => {
    setUserLinkedIds(prev =>
      prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]
    );
  };

  return (
    <div className="flex flex-col gap-6" id="parent-panel-container">
      {/* Mini top menu to switch parent views */}
      <div className="flex flex-wrap border-b border-outline-variant/30 gap-6">
        <button
          onClick={() => setActiveSubTab("missions")}
          className={`pb-3 font-label-lg text-sm transition-all border-b-2 ${
            activeSubTab === "missions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
          }`}
        >
          Gerenciar Missões
        </button>
        <button
          onClick={() => setActiveSubTab("rewards")}
          className={`pb-3 font-label-lg text-sm transition-all border-b-2 ${
            activeSubTab === "rewards"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
          }`}
        >
          Configurar Prêmios
        </button>
        <button
          onClick={() => setActiveSubTab("settings")}
          className={`pb-3 font-label-lg text-sm transition-all border-b-2 ${
            activeSubTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
          }`}
        >
          Configurações
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`pb-3 font-label-lg text-sm transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
          }`}
        >
          <span>Logs & Resgates</span>
          {(() => {
            const pendingRed = redemptions ? redemptions.filter(r => r.status === "pending").length : 0;
            const pendingApp = approvals ? approvals.filter(a => a.status === "pending").length : 0;
            const total = pendingRed + pendingApp;
            if (total > 0) {
              return (
                <span className="bg-error text-on-error text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {total}
                </span>
              );
            }
            return null;
          })()}
        </button>
        {isDavidRoot && (
          <button
            onClick={() => setActiveSubTab("users")}
            className={`pb-3 font-label-lg text-sm transition-all border-b-2 flex items-center gap-1.5 ${
              activeSubTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
            }`}
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Gerenciar Usuários</span>
            <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none">
              David Root
            </span>
          </button>
        )}
      </div>

      {/* Subtab: MISSIONS */}
      {activeSubTab === "missions" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Missões Cadastradas</h3>
            <button
              onClick={openNewMissionModal}
              className="bg-primary hover:bg-primary-container text-on-primary font-label-lg text-xs py-2 px-4 rounded-full flex items-center gap-1 chunky-button"
            >
              <Plus className="w-4 h-4" /> Nova Missão
            </button>
          </div>

          {/* Tablet Status Card in Parent Panel */}
          <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Controle Diário do Tablet</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">Status de liberação automático baseado em metas e obrigações</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isTabletUnlocked 
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {isTabletUnlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Liberado: {tabletMinutes} min</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bloqueado (0 min)</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs py-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wide">Pontos Obtidos Hoje:</span>
                <span className="font-extrabold text-primary text-base">{pointsEarnedToday} pontos</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wide">Mapeamento de Tempo:</span>
                <span className="font-bold text-on-surface">
                  {pointsEarnedToday < 80 ? "0 min (< 80 pts)" : 
                   pointsEarnedToday < 110 ? "30 min (80-109 pts)" :
                   pointsEarnedToday < 130 ? "60 min (110-129 pts)" : "90 min (130+ pts)"}
                </span>
              </div>
            </div>

            {/* Checklist items in compact grid */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-outline-variant/10">
              <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wide">Missões Essenciais Obrigatórias:</span>
              {essentialMissions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {essentialMissions.map((item) => (
                    <div key={item.id} className={`p-2 rounded-xl border text-center text-xs font-bold flex flex-col gap-0.5 transition-all ${
                      item.completed
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-amber-50 border-amber-100 text-amber-800"
                    }`}>
                      <span className="text-[10px] leading-tight truncate">{item.icon || "✨"} {item.title}</span>
                      <span className="text-[10px] uppercase font-black tracking-wider">
                        {item.completed ? "Concluído ✅" : "Pendente ⏳"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-center font-semibold text-on-surface-variant/60 bg-surface-container/30 p-3 rounded-xl border border-dashed border-outline-variant/50">
                  Nenhuma missão cadastrada ou marcada como essencial. O tablet irá liberar somente por pontos (mínimo 80 pts).
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {missions.map(mission => (
              <div
                key={mission.id}
                className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl">
                    {mission.icon || "✨"}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface leading-tight text-sm flex items-center gap-1.5">
                      {mission.title}
                      {mission.isEssential && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                          ⭐ Essencial
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-on-surface-variant capitalize">
                      {mission.period} • {mission.points} pontos • {mission.subtasks?.length || 0} etapas
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditMissionModal(mission)}
                    className="p-2 hover:bg-surface-container rounded-full text-primary transition-all"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMission(mission.id)}
                    className="p-2 hover:bg-error-container/20 rounded-full text-error transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab: REWARDS */}
      {activeSubTab === "rewards" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-on-surface">Prêmios de Troca</h3>
            <button
              onClick={openNewRewardModal}
              className="bg-primary hover:bg-primary-container text-on-primary font-label-lg text-xs py-2 px-4 rounded-full flex items-center gap-1 chunky-button"
            >
              <Plus className="w-4 h-4" /> Novo Prêmio
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-xl">
                    {reward.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface leading-tight text-sm">{reward.title}</h4>
                    <span className="text-xs text-on-surface-variant font-medium flex items-center gap-2">
                      <span>Custa <strong className="text-primary">{reward.cost} pts</strong></span>
                      {reward.periodicity && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase leading-none ${
                          reward.periodicity === 'diario'
                            ? 'bg-blue-100 text-blue-800'
                            : reward.periodicity === 'semanal'
                            ? 'bg-purple-100 text-purple-800'
                            : reward.periodicity === 'mensal'
                            ? 'bg-amber-100 text-amber-800'
                            : reward.periodicity === 'quinzenal'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {reward.periodicity === 'diario' ? 'Diário' :
                           reward.periodicity === 'semanal' ? 'Semanal' :
                           reward.periodicity === 'mensal' ? 'Mensal' :
                           reward.periodicity === 'quinzenal' ? 'Quinzenal' : 'Único'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditRewardModal(reward)}
                    className="p-2 hover:bg-surface-container rounded-full text-primary transition-all"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteReward(reward.id)}
                    className="p-2 hover:bg-error-container/20 rounded-full text-error transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab: SETTINGS */}
      {activeSubTab === "settings" && (
        <div className="flex flex-col gap-6">
          {/* Edit child profile details */}
          <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 flex flex-col gap-4">
            <h4 className="font-bold text-base text-on-surface">Perfil da Criança</h4>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant">Nome da Criança</label>
              <input
                type="text"
                value={kidName}
                onChange={e => setKidName(e.target.value)}
                className="bg-surface-container border-2 border-transparent focus:border-primary/50 focus:bg-surface-container-lowest p-3 rounded-lg text-sm font-semibold text-on-surface"
                placeholder="Ex: Lucca"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant">Emoji do Avatar</label>
              <div className="flex flex-wrap gap-2">
                {["🧑‍🚀", "🦕", "🦄", "🦁", "🦊", "🎨", "🎮", "🚀", "🤖", "👾", "📱"].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setKidAvatar(emoji)}
                    className={`text-2xl w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ${
                      kidAvatar === emoji ? "bg-primary-fixed border-primary scale-110 shadow-sm" : "bg-surface-container border-transparent hover:bg-surface-container/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/20">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Saldo Atual de Pontos (para resgates)</label>
                <input
                  type="number"
                  value={kidCurrentPoints}
                  onChange={e => setKidCurrentPoints(Number(e.target.value))}
                  className="bg-surface-container border-2 border-transparent focus:border-primary/50 focus:bg-surface-container-lowest p-3 rounded-lg text-sm font-extrabold text-primary"
                  placeholder="Ex: 2000"
                  min={0}
                />
                <span className="text-[11px] text-on-surface-variant">Pontos acumulados disponíveis para resgatar recompensas.</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Pontuação Total Histórica (conquistas)</label>
                <input
                  type="number"
                  value={kidTotalPointsAllTime}
                  onChange={e => setKidTotalPointsAllTime(Number(e.target.value))}
                  className="bg-surface-container border-2 border-transparent focus:border-primary/50 focus:bg-surface-container-lowest p-3 rounded-lg text-sm font-extrabold text-on-surface"
                  placeholder="Ex: 2000"
                  min={0}
                />
                <span className="text-[11px] text-on-surface-variant">Pontuação total acumulada em toda a jornada.</span>
              </div>
            </div>

            {profileSaveSuccess && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex gap-2 items-center text-xs font-bold border border-emerald-200 animate-fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Perfil da criança atualizado com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-primary text-on-primary py-3 rounded-full font-label-lg text-sm chunky-button mt-2"
            >
              Salvar Alterações de Perfil
            </button>
          </form>

          {/* Reset Action */}
          <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 flex flex-col gap-4">
            <h4 className="font-bold text-base text-on-surface flex items-center gap-2 text-error">
              <AlertTriangle className="w-5 h-5" /> Zona de Risco
            </h4>

            {/* Reset 1: Missões Diárias */}
            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-4">
              <h5 className="font-bold text-sm text-on-surface">Missões Diárias</h5>
              <p className="text-xs text-on-surface-variant">
                Reative todas as missões diárias para que a criança possa recomeçar o dia com o progresso zerado.
              </p>

              {showResetConfirm ? (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-error">Tem certeza? Isso zerará o progresso de hoje.</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetMissions();
                        setShowResetConfirm(false);
                        alert("Missões resetadas com sucesso!");
                      }}
                      className="flex-1 bg-error text-on-error py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Sim, Resetar Agora!
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 bg-surface-container text-on-surface-variant py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-surface-container text-error hover:bg-error-container hover:text-on-error-container py-2.5 rounded-full font-label-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Resetar Missões de Hoje
                </button>
              )}
            </div>

            {/* Reset 2: Zerar Pontuação do Bernardo */}
            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-4">
              <h5 className="font-bold text-sm text-on-surface">Zerar Pontos de Bernardo</h5>
              <p className="text-xs text-on-surface-variant">
                Zera permanentemente a pontuação atual (para resgatar prêmios) e a pontuação total (histórica) do Bernardo. Útil para começar a usar de verdade.
              </p>

              {showResetPointsConfirm ? (
                <div className="flex flex-col gap-2 mt-2 bg-error-container/20 p-3 rounded-xl border border-error/30">
                  <span className="text-xs font-bold text-error">
                    ⚠️ Esta ação zerará TODOS os pontos e histórico de Bernardo. Para confirmar, digite sua senha de responsável:
                  </span>
                  <input
                    type="password"
                    placeholder="Digite sua senha de responsável"
                    value={resetPasswordInput}
                    onChange={(e) => {
                      setResetPasswordInput(e.target.value);
                      setResetPasswordError(null);
                    }}
                    className="bg-surface-container-lowest border border-outline-variant/40 p-2.5 rounded-lg text-xs font-bold text-on-surface"
                  />
                  {resetPasswordError && (
                    <span className="text-[11px] font-bold text-error animate-pulse">
                      {resetPasswordError}
                    </span>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const currentUserObj = users.find(
                          (u) => u.username === session.username || u.name === session.name
                        );
                        if (!currentUserObj || resetPasswordInput.trim() !== currentUserObj.password) {
                          setResetPasswordError("Senha incorreta. Ação cancelada por segurança.");
                          return;
                        }
                        onUpdateKidProfile({ currentPoints: 0, totalPointsAllTime: 0, streak: 0 });
                        setShowResetPointsConfirm(false);
                        setResetPasswordInput("");
                        setResetPasswordError(null);
                        alert("Pontuação do Bernardo foi zerada com sucesso!");
                      }}
                      className="flex-1 bg-error text-on-error py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Confirmar Zerar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPointsConfirm(false);
                        setResetPasswordInput("");
                        setResetPasswordError(null);
                      }}
                      className="flex-1 bg-surface-container text-on-surface-variant py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetPointsConfirm(true)}
                  className="bg-surface-container text-error hover:bg-error-container hover:text-on-error-container py-2.5 rounded-full font-label-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Zerar Todos os Pontos (Atual e Total)
                </button>
              )}
            </div>

            {/* Reset 3: Restaurar Missões para o Padrão */}
            <div className="flex flex-col gap-2">
              <h5 className="font-bold text-sm text-on-surface">Restaurar Missões Padrão</h5>
              <p className="text-xs text-on-surface-variant">
                Exclui todas as missões cadastradas atuais e as substitui pelas 6 missões originais padrão de fábrica. Útil se houver atividades duplicadas.
              </p>

              {showRestoreMissionsConfirm ? (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-error">Tem certeza que deseja restaurar as missões originais padrão? Isso apagará todas as missões customizadas criadas!</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreDefaultMissions();
                        setShowRestoreMissionsConfirm(false);
                        alert("Missões padrão restauradas com sucesso!");
                      }}
                      className="flex-1 bg-error text-on-error py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Sim, Restaurar Originais!
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRestoreMissionsConfirm(false)}
                      className="flex-1 bg-surface-container text-on-surface-variant py-2.5 rounded-full font-bold text-xs chunky-button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRestoreMissionsConfirm(true)}
                  className="bg-surface-container text-error hover:bg-error-container hover:text-on-error-container py-2.5 rounded-full font-label-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Missões de Fábrica
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: USERS (David Root only) */}
      {activeSubTab === "users" && isDavidRoot && (
        <div className="flex flex-col gap-6 animate-fade-in" id="users-management-subtab">
          {/* Dashboard Header */}
          <div className="bg-primary/5 p-5 rounded-2xl border-2 border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
                <Users className="w-5 h-5 text-primary" /> Painel de Controle de Contas
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                Acesso administrativo restrito a <strong>David</strong>. Você pode adicionar, editar ou excluir contas, redefinir senhas e gerenciar as conexões entre pais e filhos.
              </p>
            </div>
            <button
              onClick={openNewUserModal}
              className="bg-primary hover:bg-primary-container text-on-primary font-label-lg text-xs py-3 px-5 rounded-full flex items-center gap-1.5 shadow-sm shrink-0 transition-all chunky-button"
            >
              <UserPlus className="w-4 h-4" /> Novo Usuário
            </button>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(u => {
              // Find linked users (parents linked to kid, or kids linked to parent)
              const linkedUsers = users.filter(other => u.linkedUserIds?.includes(other.id));

              return (
                <div
                  key={u.id}
                  className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-2 border-outline-variant/20 flex flex-col justify-between gap-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <span className="text-3xl bg-surface-container w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/30 shadow-sm shrink-0">
                        {u.avatar || "👤"}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-on-surface text-sm leading-tight">{u.name}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase leading-none ${
                            u.role === "kid"
                              ? "bg-secondary-container text-secondary"
                              : u.role === "mae"
                              ? "bg-tertiary-container text-tertiary"
                              : "bg-primary-container text-primary"
                          }`}>
                            {u.role === "kid" ? "Filho" : u.role === "mae" ? "Mãe" : "Pai"}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-mono mt-1.5">
                          Usuário: <strong className="text-on-surface font-bold text-xs">{u.username}</strong>
                        </span>
                        {u.email && (
                          <span className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                            E-mail: <strong className="text-on-surface font-bold text-xs">{u.email}</strong>
                          </span>
                        )}
                        <span className="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                          <span>Senha:</span>
                          <strong className="text-on-surface font-bold text-xs bg-surface-container px-1.5 py-0.25 rounded border border-outline-variant/20">
                            ••••
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="p-2 hover:bg-surface-container text-primary rounded-full transition-all border border-outline-variant/10"
                        title="Editar Usuário"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {u.username !== "davidsudre" ? (
                        <button
                          onClick={() => {
                            setUserToDelete(u);
                          }}
                          className="p-2 hover:bg-error-container/20 text-error rounded-full transition-all border border-error/15"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="p-2 text-on-surface-variant/30 cursor-not-allowed rounded-full border border-outline-variant/10 bg-surface-container/20" title="Administrador principal não pode ser deletado">
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bond/Vínculos section */}
                  <div className="bg-surface-container/40 border border-outline-variant/30 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider flex items-center gap-1">
                      <Link className="w-3 h-3 text-primary" />
                      <span>Responsáveis / Crianças Vinculadas</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {linkedUsers.length === 0 ? (
                        <span className="text-[10px] italic text-on-surface-variant/60 font-semibold">
                          Nenhum vínculo. Clique em Editar para associar pais e filhos!
                        </span>
                      ) : (
                        linkedUsers.map(linked => (
                          <span
                            key={linked.id}
                            className="bg-white border border-outline-variant/30 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-on-surface flex items-center gap-1 shadow-sm"
                          >
                            <span>{linked.avatar}</span>
                            <span>{linked.name}</span>
                            <span className="text-[8px] font-bold text-on-surface-variant/80 uppercase bg-surface-container px-1 rounded">
                              {linked.role === "kid" ? "filho" : "pais"}
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab: LOGS & RESGATES */}
      {activeSubTab === "logs" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="logs-and-redemptions-view">
          
          {/* Mission Approvals Manager */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-outline-variant/20 flex flex-col gap-4 shadow-sm" id="parent-mission-approval-section">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Check className="w-5 h-5 text-primary animate-pulse" />
                Aprovação de Missões Diárias
              </h3>
              <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                Aprovar Conclusão de Bernardo 👨‍👩‍👦
              </span>
            </div>

            {approvals && approvals.filter(a => a.status === "pending").length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {approvals.filter(a => a.status === "pending").map((app) => {
                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-amber-200 bg-amber-50/10 hover:bg-amber-50/20 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl shrink-0 bg-surface-container p-2 rounded-full">
                          {app.missionIcon || "✨"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-on-surface text-sm leading-tight">
                              {app.missionTitle}
                            </h4>
                            <span className="bg-primary-fixed/40 text-on-primary-fixed-variant text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                              +{app.points} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-none">
                            Feita em: <strong className="text-secondary">{formatSwedishDateToPtBr(app.date)}</strong> às {new Date(app.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => onRejectPoints && onRejectPoints(app.id)}
                          className="bg-error/10 hover:bg-error text-error hover:text-on-error font-black text-xs px-3.5 py-2 rounded-full flex items-center gap-1 border border-error/20 transition-all cursor-pointer"
                          title="Não aprovar e resetar a missão para Bernardo refazer"
                        >
                          <X className="w-3.5 h-3.5" /> Recusar
                        </button>
                        <button
                          onClick={() => onApprovePoints && onApprovePoints(app.id)}
                          className="bg-primary hover:bg-primary/90 text-on-primary font-black text-xs px-4 py-2 rounded-full flex items-center gap-1 shadow-sm hover:shadow transition-all chunky-button cursor-pointer"
                          title="Confirmar que Bernardo realizou a missão e liberar seus pontos"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprovar Pontos
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-on-surface-variant/60 bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center gap-2">
                <span>🌟 Todas as missões de Bernardo já foram avaliadas! Excelente trabalho de acompanhamento!</span>
                <span className="text-[10px] opacity-80">Quando ele marcar missões como concluídas no painel dele, as pendências aparecerão aqui.</span>
              </div>
            )}
          </div>
          
          {/* Redemptions / Prize delivery manager */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-outline-variant/20 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Gift className="w-5 h-5 text-tertiary" />
                Histórico de Resgate de Prêmios
              </h3>
              <span className="text-[11px] bg-tertiary/10 text-tertiary px-2.5 py-0.5 rounded-full font-bold">
                Entrega de Prêmios para Bernardo 🎁
              </span>
            </div>

            {redemptions && redemptions.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {redemptions.map((red) => {
                  const formattedDate = new Date(red.timestamp).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  const isPending = red.status === "pending";
                  const isDelivered = red.status === "delivered";
                  const isRejected = red.status === "rejected";

                  return (
                    <div
                      key={red.id}
                      className={`p-4 rounded-xl flex items-center justify-between border-2 transition-all ${
                        isPending
                          ? "bg-amber-50/40 border-amber-200"
                          : isRejected
                          ? "bg-red-50/20 border-red-200/50 opacity-70"
                          : "bg-slate-50/50 border-outline-variant/10 opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl shrink-0 bg-surface-container p-2 rounded-full">
                          {red.rewardIcon || "🎁"}
                        </span>
                        <div>
                          <h4 className="font-black text-on-surface text-sm leading-tight">
                            {red.rewardTitle}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-none">
                            Solicitado em {formattedDate} • Bernardo • Custo: <strong className="text-primary">{red.cost} pts</strong>
                          </p>
                          {red.deliveredAt && isDelivered && (
                            <span className="text-[10px] text-emerald-600 block mt-1.5 font-bold">
                              ✓ Entregue em: {new Date(red.deliveredAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] text-error block mt-1.5 font-bold flex items-center gap-1">
                              <X className="w-3 h-3" /> Recusado (Pontos Devolvidos: +{red.cost} pts)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => onUpdateRedemptionStatus(red.id, "rejected")}
                              className="bg-error/10 hover:bg-error text-error hover:text-on-error font-black text-xs px-3.5 py-2 rounded-full flex items-center gap-1 border border-error/20 transition-all cursor-pointer"
                              title="Recusar resgate e devolver os pontos para Bernardo"
                            >
                              <X className="w-3.5 h-3.5" /> Recusar
                            </button>
                            <button
                              onClick={() => onUpdateRedemptionStatus(red.id, "delivered")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-full flex items-center gap-1 shadow-sm hover:shadow transition-all chunky-button"
                              title="Confirmar que você já entregou esse prêmio a Bernardo"
                            >
                              <Check className="w-3.5 h-3.5" /> Entregar
                            </button>
                          </>
                        ) : isDelivered ? (
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Entregue
                          </span>
                        ) : (
                          <span className="text-xs bg-error/10 text-error font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-error/25">
                            <X className="w-3.5 h-3.5" /> Recusado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-on-surface-variant/60 bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/30">
                Nenhum prêmio foi resgatado por Bernardo ainda. Quando ele resgatar um prêmio no shopping, ele aparecerá aqui para você entregar! 🎁
              </div>
            )}
          </div>

          {/* Exhaustive System Logs Section */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-outline-variant/20 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Log Completo de Atividades do Servidor
              </h3>
              {onClearLogs && activityLogs && activityLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-xs text-error hover:text-error/80 font-black flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpar Histórico
                </button>
              )}
            </div>

            {activityLogs && activityLogs.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1 font-mono text-[11px] leading-snug">
                {activityLogs.map((log) => {
                  const formattedTime = new Date(log.timestamp).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  // Color code log severity
                  const isRedeem = log.type === "reward_claimed";
                  const isDone = log.type === "mission_completed";
                  const isReset = log.points === 0 && log.icon === "🔄";

                  return (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded border flex items-start justify-between gap-3 text-on-surface-variant ${
                        isRedeem
                          ? "bg-amber-50/20 border-amber-100"
                          : isDone
                          ? "bg-green-50/20 border-green-100"
                          : isReset
                          ? "bg-blue-50/10 border-blue-100"
                          : "bg-surface-container/20 border-outline-variant/10"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">{log.icon || "💻"}</span>
                        <div>
                          <p className="font-medium text-on-surface leading-tight text-[11px]">
                            {log.title}
                          </p>
                          <span className="text-[9px] text-on-surface-variant/60 block mt-0.5 font-bold uppercase tracking-wide">
                            [{formattedTime}] • {log.userName} {log.userAvatar}
                          </span>
                        </div>
                      </div>

                      {log.points !== 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 leading-none ${
                          log.points > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {log.points > 0 ? `+${log.points}` : log.points} pts
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-on-surface-variant/60 bg-surface-container rounded-2xl border-2 border-dashed border-outline-variant/30">
                Nenhuma atividade recente registrada no servidor.
              </div>
            )}
          </div>

        </div>
      )}

      {/* MISSION DIALOG MODAL */}
      <AnimatePresence>
        {isMissionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest rounded-lg max-w-[440px] w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-on-surface">
                  {editingMission ? "Editar Missão" : "Criar Nova Missão"}
                </h4>
                <button
                  onClick={() => setIsMissionModalOpen(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMission} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Nome da Atividade</label>
                  <input
                    type="text"
                    value={missionTitle}
                    onChange={e => setMissionTitle(e.target.value)}
                    placeholder="Ex: Arrumar a mochila escolar"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    required
                  />
                </div>

                 {/* AI COPILOT HELPER COMPONENT */}
                <div className="bg-gradient-to-r from-primary-fixed to-indigo-100 p-4 rounded-xl flex flex-col gap-3 border border-primary/20 shadow-md">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Sparkles className="w-4 h-4 fill-current animate-pulse text-indigo-600" />
                    <span className="text-indigo-900">Copiloto de Atividades Focus Kids</span>
                  </div>
                  <p className="text-xs text-on-primary-fixed-variant leading-relaxed font-semibold">
                    Quer ajuda para incentivar o foco da criança? Digite o título acima e clique abaixo para dividir em micro-etapas saudáveis!
                  </p>
                  <button
                    type="button"
                    onClick={handleAIBreakdown}
                    disabled={isGeneratingWithAI || !missionTitle.trim()}
                    className={`text-xs font-black py-2.5 px-4 rounded-full chunky-button flex items-center justify-center gap-1.5 transition-all shadow-md active:translate-y-[1px] ${
                      !missionTitle.trim()
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 cursor-pointer animate-pulse-subtle"
                    }`}
                  >
                    {isGeneratingWithAI ? "Carregando Estrutura..." : "Dividir com IA 🌟"}
                  </button>
                  {!missionTitle.trim() && (
                    <span className="text-[10px] text-indigo-800/80 font-bold text-center italic">
                      💡 Digite o título acima para ativar o Copiloto de IA.
                    </span>
                  )}
                  {aiFeedback && (
                    <span className={`text-[11px] font-bold text-center p-2 rounded-lg border leading-tight ${
                      aiFeedback.includes("⚠️") || aiFeedback.includes("Erro") || aiFeedback.includes("indisponível")
                        ? "text-amber-800 bg-amber-50 border-amber-200" 
                        : "text-indigo-900 bg-indigo-50 border-indigo-200"
                    }`}>
                      {aiFeedback}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Frase de Incentivo (Descrição)</label>
                  <input
                    type="text"
                    value={missionDescription}
                    onChange={e => setMissionDescription(e.target.value)}
                    placeholder="Ex: Deixe tudo pronto para seu dia amanhã ser incrível!"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Turno</label>
                    <select
                      value={missionPeriod}
                      onChange={e => setMissionPeriod(e.target.value as Period)}
                      className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    >
                      <option value="manha">Manhã ☀️</option>
                      <option value="tarde">Tarde ⛅</option>
                      <option value="noite">Noite 🌙</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Pontos</label>
                    <input
                      type="number"
                      value={missionPoints}
                      onChange={e => setMissionPoints(Number(e.target.value))}
                      className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                      min={5}
                      max={50}
                      required
                    />
                  </div>
                </div>

                {/* Switch for Essential Mission */}
                <div className="bg-surface-container/50 p-3.5 rounded-xl border border-outline-variant/20 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      ⭐ Missão Obrigatória (Essencial)
                    </span>
                    <span className="text-[10px] text-on-surface-variant leading-normal font-medium">
                      O tablet diário de Bernardo só libera se esta missão for feita!
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={missionIsEssential}
                      onChange={e => setMissionIsEssential(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Emoji do Ícone</label>
                  <div className="flex flex-wrap gap-2">
                    {["🧹", "📚", "🪥", "🛏️", "✏️", "🎒", "🧼", "🧸", "✨", "📱", "💻", "📺", "🎧", "🧩", "🧠", "🤸", "⚽", "🐾", "🌱", "🍎", "🥦", "🥕", "🍌", "🥛", "🍳", "🍲", "🍽️", "🍇", "🍉", "🍒", "🍕", "🍔", "🍿", "🍩", "💧", "⏰", "👟", "🚴", "🎨", "🚀"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMissionIcon(emoji)}
                        className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${
                          missionIcon === emoji ? "bg-primary-fixed border-primary scale-110 shadow-sm" : "bg-surface-container border-transparent hover:bg-surface-container/80"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtask list inputs */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-on-surface-variant">Micro-etapas (Passo a passo)</label>
                    <button
                      type="button"
                      onClick={addSubtaskLine}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      + Adicionar Etapa
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {missionSubtasks.map((subtask, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-on-surface-variant bg-surface-container w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={subtask}
                          onChange={e => handleSubtaskTextChange(index, e.target.value)}
                          placeholder="Ex: Separar os cadernos"
                          className="flex-1 bg-surface-container p-2.5 rounded-lg text-xs border-2 border-transparent focus:border-primary/30"
                          required
                        />
                        {missionSubtasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubtaskLine(index)}
                            className="text-error hover:bg-error-container/20 p-1.5 rounded-full"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary text-on-primary py-4 rounded-full font-label-lg text-sm chunky-button mt-2"
                >
                  {editingMission ? "Salvar Alterações" : "Salvar Nova Missão 🚀"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARD DIALOG MODAL */}
      <AnimatePresence>
        {isRewardModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest rounded-lg max-w-[400px] w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-on-surface">
                  {editingReward ? "Editar Prêmio" : "Novo Prêmio"}
                </h4>
                <button
                  onClick={() => setIsRewardModalOpen(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReward} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Nome do Prêmio</label>
                  <input
                    type="text"
                    value={rewardTitle}
                    onChange={e => setRewardTitle(e.target.value)}
                    placeholder="Ex: 30 Minutos de Videogame"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Custo em Pontos</label>
                  <input
                    type="number"
                    value={rewardCost}
                    onChange={e => setRewardCost(Number(e.target.value))}
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    min={10}
                    max={5000}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Emoji Representativo</label>
                  <div className="flex flex-wrap gap-2">
                    {["🎮", "📱", "💻", "📺", "🎧", "🕹️", "👾", "🤖", "🎬", "🍦", "🍕", "🍿", "🍩", "🍔", "⏰", "🧸", "🚲", "🎨", "🍫", "💵", "🎡"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setRewardIcon(emoji)}
                        className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${
                          rewardIcon === emoji ? "bg-tertiary-fixed border-tertiary scale-110 shadow-sm" : "bg-surface-container border-transparent hover:bg-surface-container/80"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Periodicidade</label>
                  <select
                    value={rewardPeriodicity}
                    onChange={e => setRewardPeriodicity(e.target.value as any)}
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest font-semibold text-on-surface"
                  >
                    <option value="diario">🔄 Diário (Pode ser resgatado todo dia)</option>
                    <option value="semanal">📅 Semanal (Disponível uma vez por semana)</option>
                    <option value="mensal">📆 Mensal (Disponível uma vez por mês)</option>
                    <option value="quinzenal">🗓️ Quinzenal (Disponível a cada 15 dias)</option>
                    <option value="unico">🎁 Único (Resgate único permanente)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-tertiary text-white py-4 rounded-full font-label-lg text-sm chunky-button mt-2"
                >
                  {editingReward ? "Salvar Alterações" : "Salvar Novo Prêmio 🎁"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER DIALOG MODAL */}
      <AnimatePresence>
        {isUserModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest rounded-lg max-w-[440px] w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-on-surface">
                  {editingUser ? "Editar Usuário" : "Cadastrar Novo Usuário"}
                </h4>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
                {userFormError && (
                  <div className="bg-error/10 text-error p-3 rounded-xl flex gap-2 items-center text-xs font-bold border border-error/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{userFormError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Nome Completo / Exibição</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Ex: Lucca Sudré"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Nome de Usuário (Login)</label>
                  <input
                    type="text"
                    value={userUsername}
                    onChange={e => setUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="Ex: lucca (sem espaços)"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                    required
                    disabled={editingUser?.username === "davidsudre"} // Protect root admin username
                  />
                  {editingUser?.username === "davidsudre" && (
                    <span className="text-[10px] text-on-surface-variant/70 italic">O login do administrador principal David (davidsudre) não pode ser alterado.</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">E-mail do Usuário (Opcional)</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="Ex: davidsudre@gmail.com"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                  />
                  <span className="text-[10px] text-on-surface-variant/70 italic">Permite que o usuário faça login usando o e-mail ou nome de usuário.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Senha de Acesso</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    placeholder="Ex: 1234"
                    className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest font-mono w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Perfil / Função</label>
                    <select
                      value={userRole}
                      onChange={e => {
                        const r = e.target.value as 'pai' | 'mae' | 'kid';
                        setUserRole(r);
                        // Auto-assign some fitting emojis based on role
                        if (r === "pai") setUserAvatar("👨‍💼");
                        else if (r === "mae") setUserAvatar("👩‍💼");
                        else setUserAvatar("🧑‍🚀");
                      }}
                      className="bg-surface-container p-3 rounded-lg text-sm border-2 border-transparent focus:border-primary/40 focus:bg-surface-container-lowest"
                      disabled={editingUser?.username === "davidsudre"} // Prevent demoting root admin
                    >
                      <option value="pai">Pai 👨‍💼</option>
                      <option value="mae">Mãe 👩‍💼</option>
                      <option value="kid">Criança / Filho 🧑‍🚀</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Avatar do Usuário</label>
                    <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container rounded-xl justify-start">
                      {["👨‍💼", "👩‍💼", "🧑‍🚀", "🦕", "🦄", "🦁", "🦊", "🎨", "🚀", "👑", "⚽", "🎮"].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setUserAvatar(emoji)}
                          className={`text-2xl w-11 h-11 flex items-center justify-center rounded-lg transition-all ${
                            userAvatar === emoji ? "bg-primary-fixed scale-110 shadow-sm" : "hover:scale-105 hover:bg-surface-container/80"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sincronização de Vínculos checklist (Connect kids with parents) */}
                <div className="bg-surface-container/40 p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <Link className="w-3.5 h-3.5 text-primary" />
                    <span>Conectar Usuários Sincronizados</span>
                  </span>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    {userRole === "kid"
                      ? "Marque quais pais (responsáveis) terão acesso às tarefas e relatórios deste filho:"
                      : "Marque de quais crianças este pai/mãe será responsável por gerenciar as tarefas:"}
                  </p>

                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {users
                      .filter(u => {
                        // If this user is editing/creating a child, show all parents.
                        // If this user is editing/creating a parent, show all children.
                        if (userRole === "kid") {
                          return u.role === "pai" || u.role === "mae";
                        } else {
                          return u.role === "kid";
                        }
                      })
                      .map(candidate => {
                        const isLinked = userLinkedIds.includes(candidate.id);
                        return (
                          <label
                            key={candidate.id}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                              isLinked
                                ? "bg-primary/5 border-primary text-primary"
                                : "bg-surface-container border-transparent hover:border-outline-variant/30 text-on-surface-variant"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{candidate.avatar}</span>
                              <span>{candidate.name} ({candidate.username})</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isLinked}
                              onChange={() => handleToggleUserLink(candidate.id)}
                              className="accent-primary w-4 h-4 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    {users.filter(u => userRole === "kid" ? (u.role === "pai" || u.role === "mae") : u.role === "kid").length === 0 && (
                      <span className="text-[10px] italic text-on-surface-variant/60">
                        Nenhum usuário correspondente cadastrado no sistema ainda.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary text-on-primary py-3.5 rounded-full font-label-lg text-sm chunky-button mt-2"
                >
                  {editingUser ? "Salvar Alterações de Conta" : "Salvar e Cadastrar Novo Usuário 🚀"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE USER CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest rounded-2xl max-w-[360px] w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-on-surface">Excluir Usuário?</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Tem certeza de que deseja excluir permanentemente o usuário <strong className="text-on-surface">{userToDelete.name}</strong> (<span className="font-mono">{userToDelete.username}</span>)? Esta ação não poderá ser desfeita e removerá os seus vínculos.
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs py-3 px-4 rounded-full transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteUser(userToDelete.id);
                    setUserToDelete(null);
                  }}
                  className="flex-1 bg-error hover:bg-error/90 text-on-error font-bold text-xs py-3 px-4 rounded-full transition-all shadow-sm"
                >
                  Excluir Conta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
