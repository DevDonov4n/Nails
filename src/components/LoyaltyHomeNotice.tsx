"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoyaltyHomeNotice() {
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/customer/bookings", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setAvailable(data.loyalty?.rewardsAvailable ?? 0);
      } catch {}
    }
    void load();
    return () => { active = false; };
  }, []);
  if (!available) return null;
  return (
    <div className="loyalty-home-notice">
      <div><strong>Você conquistou 50% de desconto! 💗</strong><span>Seu benefício está disponível para o próximo atendimento.</span></div>
      <Link href="/agendamento">Usar meu benefício ↗</Link>
    </div>
  );
}
