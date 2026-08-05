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

export default function ProgressReport({ missions, profile, history = [], activityLogs, redemptions }: ProgressReportProps) {
  const completedMissions = missions.filter(m => m.completed);
  const pendingMissions = missions.filter(m => !m.completed);

  // Calculate Streak dynamically (consecutive days with pointsEarned > 0)
  const streak = React.useMemo(() => {
    let count = 0;
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
    
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    let hasPointTodayOrYesterday = false;
    for (const h of sortedHistory) {
      if ((h.date === todayStr || h.date === yesterdayStr) && (h.pointsEarned || 0) > 0) {
        hasPointTodayOrYesterday = true;
        break;
      }
    }
    
    if (!hasPointTodayOrYesterday && sortedHistory.length > 0) {
      return 0;
    }
    
    let currentCheckDate = new Date();
    while (true) {
      const year = currentCheckDate.getFullYear();
      const month = String(currentCheckDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentCheckDate.getDate()).padStart(2, "0");
      const checkStr = `${year}-${month}-${day}`;
      
      const found = history.find(h => h.date === checkStr);
      if (found && (found.pointsEarned || 0) > 0) {
        count++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        if (checkStr === todayStr) {
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return count;
  }, [history]);

  // Generate real past 7 days dynamically
  const weekdays = React.useMemo(() => {
    const daysMap = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      const dayName = daysMap[d.getDay()];
      const isToday = i === 0;
      
      const historyMatch = history.find(h => h.date === dateStr);
      const points = historyMatch ? (historyMatch.pointsEarned || 0) : 0;
      
      result.push({
        name: dayName,
        points,
        dateStr,
        isToday
      });
    }
    return result;
  }, [history]);

  // Find the weekday with the maximum points in recent history to show as "Melhor Dia"
  const bestDayName = React.useMemo(() => {
    if (weekdays.length === 0) return "Sem dados";
    let best = weekdays[0];
    let foundAnyPoints = false;
    for (const w of weekdays) {
      if (w.points > 0) foundAnyPoints = true;
      if (w.points > best.points) {
        best = w;
      }
    }
    const weekdayMapFull: { [key: string]: string } = {
      "Seg": "Segunda-feira",
      "Ter": "Terça-feira",
      "Qua": "Quarta-feira",
      "Qui": "Quinta-feira",
      "Sex": "Sexta-feira",
      "Sáb": "Sábado",
      "Dom": "Domingo"
    };
    return foundAnyPoints ? (weekdayMapFull[best.name] || best.name) : "Sem dados";
  }, [weekdays]);

  const totalPoints = profile.totalPointsAllTime;

  return (
    <div className="flex flex-col gap-6" id="progress-report-container">
      {/* Trophy Section */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 p-6 rounded-2xl border-2 border-purple-100 flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-6 w-16 h-16 bg-pink-200/10 rounded-full blur-xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
            🏆
          </div>
          <div>
            <h2 className="font-black text-lg text-indigo-950">Quadro de Honra</h2>
            <p className="text-xs text-indigo-800/80 font-bold">Veja sua incrível evolução diária!</p>
          </div>
        </div>

        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] uppercase tracking-wider text-indigo-900/60 font-black">Moedas Totais</span>
          <span className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent tracking-tight flex items-center gap-1.5">
            🪙 {totalPoints}
          </span>
        </div>
      </div>

      {/* Dynamic Streak Flame Banner (Duolingo style) */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-orange-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-30 animate-pulse"></div>
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-sm">
              🔥
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
              Foco Consecutivo (Ofensiva)
            </h4>
            <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
              {streak > 0 
                ? `Mantendo o foco por ${streak} dia${streak > 1 ? "s" : ""} seguido${streak > 1 ? "s" : ""}! Sensacional!`
                : "Faça uma missão hoje para iniciar sua sequência de foco! ⚡"}
            </p>
          </div>
        </div>
        <div className="text-center bg-orange-500 px-4 py-2 rounded-xl text-white shadow-sm border border-orange-400 select-none">
          <span className="block text-xl font-black leading-none">{streak}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Dias</span>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <section aria-labelledby="metrics-title">
        <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900/70 mb-3 flex items-center gap-2" id="metrics-title">
          <Trophy className="w-5 h-5 text-purple-600" />
          Metas do Dia
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-purple-100/50 hover:border-purple-200 transition-all flex flex-col gap-1">
            <span className="text-indigo-900/60 font-black text-[10px] uppercase tracking-wider">Moedas Disponíveis</span>
            <span className="text-indigo-900 font-headline-lg text-3xl font-black tracking-tight flex items-center gap-1">
              🪙 {profile.currentPoints}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-teal-100/50 hover:border-teal-200 transition-all flex flex-col gap-1">
            <span className="text-teal-900/60 font-black text-[10px] uppercase tracking-wider">Concluídas Hoje</span>
            <span className="text-teal-600 font-headline-lg text-3xl font-black tracking-tight flex items-center gap-1.5">
              ✅ {completedMissions.length}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-pink-100/50 hover:border-pink-200 transition-all flex flex-col gap-1">
            <span className="text-pink-900/60 font-black text-[10px] uppercase tracking-wider">Pendentes</span>
            <span className="text-pink-500 font-headline-lg text-3xl font-black tracking-tight flex items-center gap-1.5">
              ⏳ {pendingMissions.length}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-amber-100/50 hover:border-amber-200 transition-all flex flex-col gap-1">
            <span className="text-amber-900/60 font-black text-[10px] uppercase tracking-wider">Melhor Dia do Ciclo</span>
            <span className="text-amber-600 font-black text-sm mt-2 leading-tight">
              📅 {bestDayName}
            </span>
          </div>
        </div>
      </section>

      {/* Weekly History Chart / Visualization */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-purple-100/60 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-wider text-indigo-900/70 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Evolução Semanal
          </h3>
          <span className="text-xs font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-teal-100">
            <TrendingUp className="w-3.5 h-3.5" /> +25% de foco
          </span>
        </div>

        {/* Visual custom bar chart with glows */}
        <div className="flex items-end justify-between h-36 pt-4 px-2 border-b border-indigo-50/50">
          {weekdays.map((day, idx) => {
            const maxPoints = Math.max(50, ...weekdays.map(w => w.points));
            const barHeight = day.points > 0 ? (day.points / maxPoints) * 100 : 8; // min height
            const isToday = day.isToday;
            
            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full px-1 flex justify-center items-end h-24 relative group">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-950 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm pointer-events-none select-none z-10">
                    {day.points} pts
                  </div>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ delay: idx * 0.04, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-t-lg max-w-[22px] transition-all duration-200 relative ${
                      day.points === 0
                        ? "bg-slate-100 border border-slate-200/50"
                        : isToday
                        ? "bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 shadow-[0_4px_12px_rgba(139,92,246,0.3)] border border-purple-300"
                        : "bg-gradient-to-t from-teal-400 to-teal-500 shadow-[0_4px_10px_rgba(20,184,166,0.15)] border border-teal-200"
                    }`}
                  >
                    {day.points > 0 && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full blur-[0.5px]"></div>
                    )}
                  </motion.div>
                </div>
                <span
                  translate="no"
                  className={`notranslate text-[10px] font-extrabold tracking-wide ${isToday ? "text-indigo-600 font-black uppercase underline decoration-2 underline-offset-4" : "text-on-surface-variant/80"}`}
                >
                  {day.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-on-surface-variant/90 bg-indigo-50/50 border border-indigo-100/50 p-3.5 rounded-xl leading-relaxed">
          <Flame className="w-4.5 h-4.5 text-orange-500 animate-pulse shrink-0" />
          <span>
            <strong>Dica de Foco:</strong> Celebrar cada pequena vitória ativa a dopamina saudável e ajuda a fixar a rotina! Bom trabalho, {profile.name}! 🚀
          </span>
        </div>
      </div>

      {/* Recent Activities/Achievements Log */}
      <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
          <Award className="w-5 h-5 text-tertiary" />
          Mural de Conquistas Recentes
        </h3>
        
        {activityLogs && activityLogs.filter(log => ["mission_completed", "mission_subtask", "reward_claimed", "points_added"].includes(log.type)).length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {activityLogs
              .filter(log => ["mission_completed", "mission_subtask", "reward_claimed", "points_added"].includes(log.type))
              .slice(0, 8)
              .map((log) => {
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
