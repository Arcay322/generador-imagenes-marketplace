"use client";
import { useEffect, useState } from "react";
import { Coins, Crown } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function CreditsBadge() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setCredits(null); return; }
    user.getIdToken().then((t) =>
      fetch("/api/credits", { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => r.json())
        .then((d) => setCredits(d.credits ?? 0))
        .catch(() => {})
    );
  }, [user]);

  if (!user || credits === null) return null;
  const low = credits <= 2;
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border ${low ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"}`}>
      <Coins className="h-3.5 w-3.5" />
      <span>{credits} créditos</span>
      {low && <Crown className="h-3 w-3" />}
    </div>
  );
}
