import React from "react";
import { Mission, KidProfile, DailyStats, ActivityLog, RedemptionLog } from "../types";
import { Award, CheckCircle2, CircleDot, Flame, Calendar, Trophy, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface ProgressReportProps {
  missions: Mission[];
  profile: KidProfile;
  history: DailyStats[];
  activityLogs?: ActivityLog[];
  redemptions?: RedemptionLog[];
}

export default function ProgressReport({ missions, profile, history, activityLogs, redemptions }: ProgressReportProps) {
  const completedMissions = missions.filter(m => m.completed);
  const pendingMissions = missions.filter(m => !m.completed);

  // Hardcoded or dynamically calculated weekdays
  const weekdays = [
    { name: "Seg", completed: true, points: 35 },
    { name: "Ter", completed: true, points: 50 }, // Best Day
    { name: "Qua", completed: true, points: 40 },
    { name: "Qui", completed: false, points: 15 },
    { name: "Sex", completed: false, points: 20 },
    { name: "Sáb", completed: false, points: 0 },
    { name: "Dom", completed: false, points: 0 },
  ];

  const totalPoints = profile.totalPointsAllTime;

  return (
    <div className="flex flex-col gap-6" id="progress-report-container">
      {/* Trophy Section */}
      <div className="bg-gradient-to-br from-primary-fixed to-indigo-100 p-6 rounded-lg shadow-sm border-b-4 border-primary flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center text-3xl shadow-sm">
            🏆
          </div>
          <div>
            <h2 className="font-bold text-xl text-on-primary-fixed">Quadro de Medalhas</h2>
            <p className="text-xs text-on-primary-fixed-variant font-medium">Veja o quão longe você já chegou!</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-on-primary-fixed-variant font-bold">Pontos Totais</span>
          <span className="text-2xl font-black text-primary tracking-tight">{totalPoints} pts</span>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <section aria-labelledby="metrics-title">
        <h3 className="font-bold text-lg text-on-surface mb-3 flex items-center gap-2" id="metrics-title">
          <Trophy className="w-5 h-5 text-tertiary-container" />
          Metas do Dia
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border-b-4 border-primary flex flex-col gap-1">
            <span className="text-on-surface-variant font-bold text-xs">Total de Pontos Atuais</span>
            <span className="text-primary font-headline-lg text-3xl font-black tracking-tight">{profile.currentPoints}</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border-b-4 border-secondary flex flex-col gap-1">
            <span className="text-on-surface-variant font-bold text-xs">Concluídas Hoje</span>
            <span className="text-secondary font-headline-lg text-3xl font-black tracking-tight">{completedMissions.length}</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border-b-4 border-error flex flex-col gap-1">
            <span className="text-on-surface-variant font-bold text-xs">Pendentes</span>
            <span className="text-error font-headline-lg text-3xl font-black tracking-tight">{pendingMissions.length}</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border-b-4 border-tertiary flex flex-col gap-1">
            <span className="text-on-surface-variant font-bold text-xs">Melhor Dia Recente</span>
            <span className="text-tertiary font-bold text-base mt-1.5 leading-tight">Terça-feira</span>
          </div>
        </div>
      </section>

      {/* Weekly History Chart / Visualization */}
      <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Evolução Semanal
          </h3>
          <span className="text-xs font-bold text-secondary flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +25% de foco
          </span>
        </div>

        {/* Visual custom bar chart */}
        <div className="flex items-end justify-between h-36 pt-4 px-2 border-b border-outline-variant/30">
          {weekdays.map((day, idx) => {
            const maxPoints = 50;
            const barHeight = day.points > 0 ? (day.points / maxPoints) * 100 : 8; // min height
            const isToday = idx === 1; // Mark "Ter" as best day
            return (
              <div key={day.name} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full px-1.5 flex justify-center items-end h-24">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.6 }}
                    className={`w-full rounded-t-md max-w-[20px] ${
                      day.points === 0
                        ? "bg-surface-container"
                        : isToday
                        ? "bg-gradient-to-t from-primary to-primary-container shadow-sm"
                        : "bg-secondary-fixed-dim"
                    }`}
                  />
                </div>
                <span className={`text-xs font-bold ${isToday ? "text-primary font-black" : "text-on-surface-variant"}`}>
                  {day.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant/80 bg-surface-container-low p-3 rounded-lg leading-snug">
          <Flame className="w-4 h-4 text-tertiary animate-pulse shrink-0" />
          <span>
            <strong>Dica de Foco:</strong> Celebrar cada pequeno passo ativa a dopamina natural e ajuda a manter a rotina divertida! Muito bom trabalho, {profile.name}!
          </span>
        </div>
      </div>

      {/* Recent Activities/Achievements Log */}
      <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
          <Award className="w-5 h-5 text-tertiary" />
          Mural de Conquistas Recentes
        </h3>
        
        {activityLogs && activityLogs.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {activityLogs.slice(0, 8).map((log) => {
              const formattedTime = new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
              });
              
              // Define tag styles depending on type
              const isReward = log.type === "reward_claimed";
              const isMission = log.type === "mission_completed";
              const isSubtask = log.type === "mission_subtask";

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg flex items-center justify-between border text-xs transition-all ${
                    isReward
                      ? "bg-amber-50/50 border-amber-100"
                      : isMission
                      ? "bg-green-50/50 border-green-100 font-bold"
                      : "bg-surface-container-low/50 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">
                      {log.icon || "✨"}
                    </span>
                    <div>
                      <p className="text-on-surface text-xs font-medium leading-tight">
                        {log.title}
                      </p>
                      <span className="text-[10px] text-on-surface-variant/60">
                        {formattedTime} • por {log.userName} {log.userAvatar}
                      </span>
                    </div>
                  </div>

                  {log.points !== undefined && log.points !== 0 && (
                    <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ${
                      log.points > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {log.points > 0 ? `+${log.points}` : log.points} pts
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-on-surface-variant/60 bg-surface-container-low rounded-lg border border-dashed border-outline-variant/50">
            Nenhuma conquista registrada ainda. Faça sua primeira missão para começar! 🚀
          </div>
        )}
      </div>
    </div>
  );
}
