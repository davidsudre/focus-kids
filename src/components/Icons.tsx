import React from "react";
import { Calendar, Award, BarChart3, Users } from "lucide-react";

export function TodayIcon({ active }: { active: boolean }) {
  return (
    <div className={`p-1 rounded-full transition-all ${active ? "text-primary" : "text-on-surface-variant/70"}`}>
      <Calendar className={`w-6 h-6 transition-transform ${active ? "scale-110 fill-primary/10" : "scale-100"}`} />
    </div>
  );
}

export function RecompensasIcon({ active }: { active: boolean }) {
  return (
    <div className={`p-1 rounded-full transition-all ${active ? "text-tertiary" : "text-on-surface-variant/70"}`}>
      <Award className={`w-6 h-6 transition-transform ${active ? "scale-110 fill-tertiary/10" : "scale-100"}`} />
    </div>
  );
}

export function ProgressoIcon({ active }: { active: boolean }) {
  return (
    <div className={`p-1 rounded-full transition-all ${active ? "text-secondary" : "text-on-surface-variant/70"}`}>
      <BarChart3 className={`w-6 h-6 transition-transform ${active ? "scale-110 fill-secondary/10" : "scale-100"}`} />
    </div>
  );
}

export function PaisIcon({ active }: { active: boolean }) {
  return (
    <div className={`p-1 rounded-full transition-all ${active ? "text-primary" : "text-on-surface-variant/70"}`}>
      <Users className={`w-6 h-6 transition-transform ${active ? "scale-110 fill-primary/10" : "scale-100"}`} />
    </div>
  );
}
