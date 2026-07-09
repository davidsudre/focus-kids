import React, { useState } from "react";
import { Mission, KidProfile, Period, ApprovalRequest } from "../types";
import { Sun, CloudSun, Moon, Star, Sparkles, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Smartphone, Lock, Unlock, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KidDashboardProps {
  missions: Mission[];
  profile: KidProfile;
  onToggleSubtask: (missionId: string, subtaskIndex: number) => void;
  onCompleteMission: (missionId: string) => void;
  onClaimPoints: (points: number) => void;
  approvals?: ApprovalRequest[];
  onClaimTabletBonus?: () => void;
}

export default function KidDashboard({
  missions,
  profile,
  onToggleSubtask,
  onCompleteMission,
  onClaimPoints,
  approvals = [],
  onClaimTabletBonus
}: KidDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("manha");
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<{ show: boolean; points: number; title: string } | null>(null);

  // Tablet unlock system logic
  const completedMissionsToday = missions.filter(m => m.completed);
  const pointsEarnedToday = completedMissionsToday.reduce((sum, m) => sum + m.points, 0);

  // Dynamic Essential Missions check
  const essentialMissions = missions.filter(m => m.isEssential);
  const allEssentialsCompleted = essentialMissions.length === 0 || essentialMissions.every(m => m.completed);

  let tabletMinutes = 0;
  let hasBonusOption = false;

  if (pointsEarnedToday >= 80 && pointsEarnedToday <= 109) {
    tabletMinutes = 30;
  } else if (pointsEarnedToday >= 110 && pointsEarnedToday <= 129) {
    tabletMinutes = 60;
  } else if (pointsEarnedToday >= 130 && pointsEarnedToday <= 149) {
    tabletMinutes = 90;
  } else if (pointsEarnedToday >= 150) {
    tabletMinutes = 90;
    hasBonusOption = true;
  }

  const isTabletUnlocked = pointsEarnedToday >= 80 && allEssentialsCompleted;

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const isBonusClaimedToday = profile.tabletBonusClaimedDate === todayStr;

  // Filter missions by selected period
  const filteredMissions = missions.filter(m => m.period === selectedPeriod);

  // Count progress
  const totalInPeriod = filteredMissions.length;
  const completedInPeriod = filteredMissions.filter(m => m.completed).length;
  const progressPercent = totalInPeriod > 0 ? (completedInPeriod / totalInPeriod) * 100 : 0;

  const handleSubtaskChange = (missionId: string, index: number, isCurrentlyCompleted: boolean) => {
    // Find the mission to check if this completion triggers the final completion
    const mission = missions.find(m => m.id === missionId);
    if (mission && mission.subtasks && mission.completedSubtasks) {
      // Create a temporary copy of completed list to check if ALL will be completed
      const nextCompleted = [...mission.completedSubtasks];
      nextCompleted[index] = !isCurrentlyCompleted;

      const allDone = nextCompleted.every(val => val === true);
      if (allDone && !mission.completed) {
        // Trigger celebration!
        setShowCelebration({
          show: true,
          points: mission.points,
          title: mission.title
        });
        // Call parent completion handler (will also set all subtasks as complete on db)
        onCompleteMission(missionId);
        // Collapse card
        setExpandedMissionId(null);
      } else {
        // Just toggle single subtask normally
        onToggleSubtask(missionId, index);
      }
    } else {
      onToggleSubtask(missionId, index);
    }
  };

  const handleQuickComplete = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      // Trigger celebration!
      setShowCelebration({
        show: true,
        points: mission.points,
        title: mission.title
      });
      // Call parent completion handler
      onCompleteMission(missionId);
      // Collapse card
      setExpandedMissionId(null);
    }
  };

  const toggleExpand = (missionId: string) => {
    if (expandedMissionId === missionId) {
      setExpandedMissionId(null);
    } else {
      setExpandedMissionId(missionId);
    }
  };

  const getPeriodIcon = (period: Period) => {
    switch (period) {
      case "manha":
        return <Sun className="w-5 h-5 text-amber-500" />;
      case "tarde":
        return <CloudSun className="w-5 h-5 text-indigo-500" />;
      case "noite":
        return <Moon className="w-5 h-5 text-blue-900" />;
    }
  };

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case "manha":
        return "Manhã";
      case "tarde":
        return "Tarde";
      case "noite":
        return "Noite";
    }
  };

  return (
    <div className="flex flex-col gap-6" id="kid-dashboard-container">
      {/* Celebration Modal Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-6"
            onClick={() => setShowCelebration(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 50 }}
              className="bg-surface-container-lowest p-8 rounded-lg max-w-[400px] w-full text-center shadow-[0_12px_40px_rgba(0,96,172,0.15)] border-2 border-secondary/30 flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-4xl animate-bounce">
                🎉
              </div>
              <div>
                <span className="text-secondary font-label-lg uppercase tracking-widest text-xs">Missão Cumprida!</span>
                <h3 className="text-headline-md font-bold text-on-surface mt-1">{showCelebration.title}</h3>
                <p className="text-on-surface-variant text-sm mt-2">
                  Você foi incrível e completou todos os passos com sucesso!
                </p>
              </div>

              <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-6 py-3 rounded-full font-bold flex items-center gap-2 text-lg shadow-sm">
                <Star className="w-5 h-5 fill-current text-tertiary animate-pulse" />
                Ganhou +{showCelebration.points} Pontos!
              </div>

              <button
                onClick={() => setShowCelebration(null)}
                className="w-full bg-primary text-on-primary py-4 rounded-full font-label-lg chunky-button mt-2 hover:opacity-90"
              >
                Continuar Avançando 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kid Header & Scoreboard */}
      <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0_4px_24px_rgba(0,96,172,0.06)] border-b-4 border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-3xl border-2 border-primary-fixed-dim">
            {profile.avatar}
          </div>
          <div>
            <h2 className="text-headline-md font-bold text-on-surface">Olá, {profile.name}!</h2>
            <div className="flex items-center gap-1 bg-secondary-container/30 px-3 py-1 rounded-full text-secondary text-xs font-bold mt-1">
              <Sparkles className="w-3 h-3 fill-current text-secondary animate-pulse" />
              <span>{profile.streak} dias seguidos!</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-on-surface-variant font-medium">Pontos Atuais</span>
          <div className="flex items-center gap-1.5 text-primary">
            <span className="text-3xl font-bold tracking-tight">{profile.currentPoints}</span>
            <Star className="w-6 h-6 fill-current text-tertiary-fixed-dim" />
          </div>
          {(() => {
            const pending = approvals.filter(a => a.status === "pending").reduce((sum, a) => sum + a.points, 0);
            if (pending > 0) {
              return (
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1 animate-pulse">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  +{pending} pts pendentes
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Daily Tablet Unlock Section */}
      <div className="bg-surface-container-lowest p-5 rounded-lg shadow-[0_4px_24px_rgba(0,96,172,0.06)] border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-bold text-base text-on-surface leading-tight">Desbloqueio Diário de Tablet</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">O tablet de hoje depende das suas missões diárias!</p>
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

        {/* Info or instructions */}
        <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-on-surface-variant">Pontos das Missões de Hoje:</span>
            <span className="text-primary text-sm font-black">{pointsEarnedToday} pts</span>
          </div>

          {/* Progress Bar with milestones */}
          <div className="relative pt-2 pb-6">
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((pointsEarnedToday / 150) * 100, 100)}%` }}
              />
            </div>

            {/* Milestones markers on the bar */}
            <div className="absolute top-1 left-0 w-full flex justify-between px-1">
              {[0, 80, 110, 130, 150].map((pts) => {
                const reached = pointsEarnedToday >= pts;
                return (
                  <div key={pts} className="flex flex-col items-center">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      reached ? "bg-primary border-primary" : "bg-background border-outline-variant"
                    }`}>
                      {reached && <Check className="w-2 h-2 text-on-primary" />}
                    </div>
                    <span className={`text-[9px] font-bold mt-1 ${reached ? "text-primary font-black" : "text-on-surface-variant/60"}`}>
                      {pts} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unlock tiers cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {[
              { label: "80 pts", time: "30 min", min: 80, max: 109 },
              { label: "110 pts", time: "60 min", min: 110, max: 129 },
              { label: "130 pts", time: "90 min", min: 130, max: 149 },
              { label: "150 pts", time: "90 min + 🎁", min: 150, max: 999 }
            ].map((tier, idx) => {
              const active = pointsEarnedToday >= tier.min;
              const currentRange = pointsEarnedToday >= tier.min && pointsEarnedToday <= tier.max;
              return (
                <div key={idx} className={`p-2 rounded-xl border text-center flex flex-col gap-0.5 transition-all ${
                  isTabletUnlocked && currentRange
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-300/30"
                    : active && isTabletUnlocked
                    ? "bg-slate-50 border-slate-200 text-slate-500 opacity-70"
                    : active && !isTabletUnlocked
                    ? "bg-amber-50/50 border-amber-200 text-amber-800 opacity-80"
                    : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant/40"
                }`}>
                  <span className="text-[9px] font-bold uppercase">{tier.label}</span>
                  <span className="text-xs font-black">{tier.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Essential Missions checklist */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Missões Essenciais Obrigatórias:
            </h4>
            {allEssentialsCompleted ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                Todas feitas! 🎉
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                Falta concluir ⏳
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {essentialMissions.length > 0 ? (
              essentialMissions.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  m.completed 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-amber-50/50 border-amber-100 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.icon || "✨"}</span>
                    <span>{m.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.completed ? (
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        Feito ✅
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 text-center py-4 text-xs font-semibold text-on-surface-variant/60 bg-surface-container/50 p-3 rounded-xl border border-dashed border-outline-variant/50">
                Nenhuma missão marcada como essencial para hoje. O tablet será liberado somente pela pontuação (mínimo de 80 pts)!
              </div>
            )}
          </div>

          {/* Warning if points are enough but essentials are pending */}
          {pointsEarnedToday >= 80 && !allEssentialsCompleted && (
            <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl border border-amber-200 text-xs font-medium flex gap-2 items-start mt-1">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold">Quase lá!</p>
                <p className="opacity-90">Você já tem {pointsEarnedToday} pontos (suficientes para {tabletMinutes} minutos), mas o tablet só libera após concluir todas as missões essenciais pendentes acima!</p>
              </div>
            </div>
          )}
        </div>

        {/* Bonus Claim Card */}
        {hasBonusOption && isTabletUnlocked && !isBonusClaimedToday && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-xl text-white text-center flex flex-col items-center gap-2 shadow-lg"
          >
            <span className="text-2xl animate-bounce">🎁</span>
            <h4 className="font-bold text-sm">Super Meta de 150 pts Alcançada!</h4>
            <p className="text-xs opacity-90">Você ganhou um prêmio extra de 10 pontos de bônus por ser incrível hoje!</p>
            <button 
              onClick={onClaimTabletBonus}
              className="bg-white text-amber-700 hover:bg-amber-50 px-5 py-2.5 rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Resgatar +10 Pontos de Bônus 🚀
            </button>
          </motion.div>
        )}

        {hasBonusOption && isTabletUnlocked && isBonusClaimedToday && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5">
            <span>🎁 Bônus de 10 pts diário já resgatado com sucesso!</span>
          </div>
        )}
      </div>

      {/* Turno/Period Selector tabs */}
      <div className="flex justify-between bg-surface-container p-1 rounded-full gap-1 shadow-inner">
        {(["manha", "tarde", "noite"] as Period[]).map(period => {
          const isActive = selectedPeriod === period;
          return (
            <button
              key={period}
              onClick={() => {
                setSelectedPeriod(period);
                setExpandedMissionId(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-label-lg text-sm transition-all duration-300 ${
                isActive
                  ? "bg-surface-container-lowest text-primary shadow-[0_3px_10px_rgba(0,96,172,0.08)] scale-[1.02]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {getPeriodIcon(period)}
              <span>{getPeriodLabel(period)}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Progress for this Period */}
      <div className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
          <span>Progresso do Turno</span>
          <span className="font-bold text-primary">
            {completedInPeriod} de {totalInPeriod} concluídos
          </span>
        </div>
        <div className="w-full bg-surface-container h-4 rounded-full overflow-hidden">
          <motion.div
            className="bg-secondary h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Missions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.length === 0 ? (
          <div className="col-span-full bg-surface-container-low p-8 rounded-lg text-center border-2 border-dashed border-outline-variant/40 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-on-surface-variant/50" />
            <p className="text-on-surface-variant font-medium">Nenhuma missão cadastrada para este turno.</p>
            <p className="text-xs text-on-surface-variant/70">Os pais podem cadastrar novas missões no Painel dos Pais!</p>
          </div>
        ) : (
          filteredMissions.map(mission => {
            const isExpanded = expandedMissionId === mission.id;
            return (
              <div
                key={mission.id}
                className={`bg-surface-container-lowest rounded-lg border-2 transition-all duration-200 shadow-sm ${
                  mission.completed
                    ? "border-secondary/20 bg-secondary-container/5"
                    : isExpanded
                    ? "border-primary/40 ring-4 ring-primary/5 shadow-md"
                    : "border-outline-variant/30"
                }`}
              >
                {/* Main Card header */}
                <div
                  onClick={() => !mission.completed && toggleExpand(mission.id)}
                  className={`p-5 flex items-center justify-between cursor-pointer ${
                    mission.completed ? "cursor-default" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon container */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${
                        mission.completed
                          ? "bg-secondary-container text-secondary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {mission.completed ? "✅" : mission.icon || "✨"}
                    </div>

                    <div>
                      <h3
                        className={`font-bold text-lg leading-tight transition-all ${
                          mission.completed ? "text-on-surface-variant/60 line-through" : "text-on-surface"
                        }`}
                      >
                        {mission.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-on-surface-variant font-medium">
                        <span className="bg-primary-fixed/40 px-2 py-0.5 rounded-full text-on-primary-fixed-variant">
                          +{mission.points} pts
                        </span>
                        {mission.subtasks && mission.subtasks.length > 0 && (
                          <span className="bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                            {mission.completedSubtasks?.filter(Boolean).length || 0}/{mission.subtasks.length} etapas
                          </span>
                        )}
                        {mission.createdBy === "pai" && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-bold text-[10px]">
                            👨‍💼 Pai
                          </span>
                        )}
                        {mission.createdBy === "mae" && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100 font-bold text-[10px]">
                            👩‍💼 Mãe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!mission.completed && (
                    <button className="text-on-surface-variant/60 hover:text-on-surface p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Expanded subtask steps */}
                <AnimatePresence>
                  {isExpanded && !mission.completed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-outline-variant/30 bg-surface-container-low"
                    >
                      <div className="p-5 flex flex-col gap-4">
                        <p className="text-sm text-on-surface-variant italic font-medium leading-relaxed bg-surface-container-lowest p-3 rounded-lg border-l-4 border-primary">
                          "{mission.description}"
                        </p>

                        <div className="flex flex-col gap-3">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Passo a passo (Diga sim a cada missão!):
                          </span>
                          {mission.subtasks?.map((subtask, index) => {
                            const isSubtaskDone = mission.completedSubtasks?.[index] || false;
                            return (
                              <button
                                key={index}
                                onClick={() => handleSubtaskChange(mission.id, index, isSubtaskDone)}
                                className={`flex items-center gap-4 p-4 rounded-lg text-left transition-all border-2 w-full font-medium ${
                                  isSubtaskDone
                                    ? "bg-secondary-container/10 border-secondary/40 text-on-surface-variant/80"
                                    : "bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/30"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSubtaskDone
                                      ? "bg-secondary border-secondary text-on-secondary"
                                      : "border-outline text-outline font-bold text-xs"
                                  }`}
                                >
                                  {isSubtaskDone ? "✓" : index + 1}
                                </div>
                                <span className={`flex-1 text-sm ${isSubtaskDone ? "line-through opacity-70" : ""}`}>
                                  {subtask}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick complete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickComplete(mission.id);
                          }}
                          className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-700"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
                          <span>Concluir Missão Inteira! 🏆</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
