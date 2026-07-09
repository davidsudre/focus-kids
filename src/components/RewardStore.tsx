import React, { useState } from "react";
import { Reward, KidProfile } from "../types";
import { Star, Gift, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RewardStoreProps {
  rewards: Reward[];
  profile: KidProfile;
  onClaimReward: (rewardId: string, cost: number) => void;
}

export default function RewardStore({ rewards, profile, onClaimReward }: RewardStoreProps) {
  const [successClaim, setSuccessClaim] = useState<Reward | null>(null);

  const handleClaim = (reward: Reward) => {
    if (profile.currentPoints >= reward.cost) {
      onClaimReward(reward.id, reward.cost);
      setSuccessClaim(reward);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="reward-store-container">
      {/* Success Reward Claim Modal */}
      <AnimatePresence>
        {successClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-6"
            onClick={() => setSuccessClaim(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-surface-container-lowest p-8 rounded-lg max-w-[400px] w-full text-center shadow-[0_12px_40px_rgba(0,96,172,0.15)] border-2 border-tertiary/30 flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-tertiary-fixed flex items-center justify-center text-4xl animate-bounce">
                🎁
              </div>
              <div>
                <span className="text-tertiary font-label-lg uppercase tracking-widest text-xs">Recompensa Desbloqueada!</span>
                <h3 className="text-headline-md font-bold text-on-surface mt-1">{successClaim.title}</h3>
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                  Parabéns! Você usou seus pontos com sabedoria. Mostre esta tela para o papai ou mamãe para receber sua recompensa!
                </p>
              </div>

              <div className="bg-primary-fixed text-on-primary-fixed px-5 py-2.5 rounded-full font-bold text-sm">
                Custo: {successClaim.cost} Pontos deduzidos!
              </div>

              <button
                onClick={() => setSuccessClaim(null)}
                className="w-full bg-secondary text-on-secondary py-4 rounded-full font-label-lg chunky-button hover:opacity-90 mt-2"
              >
                Eba, Combinado! 👍
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Profile Points */}
      <div className="bg-gradient-to-br from-tertiary-fixed to-amber-200 p-6 rounded-lg shadow-sm border-b-4 border-tertiary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-2xl shadow-sm">
            👑
          </div>
          <div>
            <h2 className="font-bold text-xl text-on-tertiary-fixed-variant">Baú de Prêmios</h2>
            <p className="text-xs text-on-tertiary-fixed-variant/80 font-medium">Troque seus pontos por prêmios!</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest py-2 px-4 rounded-full flex items-center gap-1.5 shadow-sm">
          <Star className="w-5 h-5 fill-current text-tertiary-fixed-dim" />
          <span className="font-bold text-lg text-primary">{profile.currentPoints}</span>
          <span className="text-xs text-on-surface-variant font-bold">pts</span>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map(reward => {
          const canAfford = profile.currentPoints >= reward.cost;
          return (
            <div
              key={reward.id}
              className={`bg-surface-container-lowest p-5 rounded-lg border-2 shadow-sm flex items-center justify-between transition-all ${
                canAfford ? "border-tertiary-fixed-dim/40 hover:shadow-md" : "border-outline-variant/20 opacity-75"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Reward icon circular wrapper */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm ${
                    canAfford ? "bg-tertiary-fixed/40" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {reward.icon}
                </div>

                <div>
                  <h3 className="font-bold text-lg text-on-surface leading-tight">{reward.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-primary flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-tertiary-fixed-dim" />
                      {reward.cost} pts
                    </span>
                    {reward.periodicity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        reward.periodicity === 'diario'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : reward.periodicity === 'semanal'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : reward.periodicity === 'mensal'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : reward.periodicity === 'quinzenal'
                          ? 'bg-pink-50 text-pink-700 border-pink-100'
                          : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {reward.periodicity === 'diario' ? '🔄 Diário' :
                         reward.periodicity === 'semanal' ? '📅 Semanal' :
                         reward.periodicity === 'mensal' ? '📆 Mensal' :
                         reward.periodicity === 'quinzenal' ? '🗓️ Quinzenal' : '🎁 Único'}
                      </span>
                    )}
                    {reward.claimedCount > 0 && (
                      <span className="bg-secondary-container/30 text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Resgatado {reward.claimedCount}x
                      </span>
                    )}
                    {reward.createdBy === "pai" && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-bold">
                        👨‍💼 Pai
                      </span>
                    )}
                    {reward.createdBy === "mae" && (
                      <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-full border border-rose-100 font-bold">
                        👩‍💼 Mãe
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {canAfford ? (
                  <button
                    onClick={() => handleClaim(reward)}
                    className="bg-tertiary-container hover:bg-tertiary text-white font-label-lg text-sm px-5 py-3 rounded-full chunky-button flex items-center gap-1.5"
                  >
                    <Gift className="w-4 h-4" />
                    Resgatar
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center text-xs text-on-surface-variant font-bold bg-surface-container px-4 py-3 rounded-full border border-outline-variant/30 text-center gap-1">
                    <span>Faltam</span>
                    <span className="text-primary font-bold">
                      {reward.cost - profile.currentPoints} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
