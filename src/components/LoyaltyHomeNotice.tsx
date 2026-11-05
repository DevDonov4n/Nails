"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoyaltyHomeNotice() {
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/customer/bookings", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const rewardsAvailable = data.loyalty?.rewardsAvailable ?? 0;
        const rewardsEarned = data.loyalty?.rewardsEarned ?? 0;
        const rewardKey = `nbs-loyalty-reward-${rewardsEarned}`;
        if (active && rewardsAvailable > 0 && window.localStorage.getItem(rewardKey) !== "seen") {
          setShowReward(true);
          window.localStorage.setItem(rewardKey, "seen");
        }
      } catch {
        // A página inicial continua disponível mesmo se a conta não puder ser consultada.
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (!showReward) return null;

  return (
    <div className="customer-notice-backdrop" role="presentation">
      <section className="customer-notice customer-notice--loyalty" role="alertdialog" aria-modal="true" aria-labelledby="home-loyalty-title">
        <button type="button" onClick={() => setShowReward(false)} aria-label="Fechar">×</button>
        <p className="eyebrow">RECOMPENSA DE FIDELIDADE</p>
        <div className="customer-notice-gift" aria-hidden="true">50%</div>
        <h2 id="home-loyalty-title">Você conquistou 50% de desconto!</h2>
        <p>Parabéns! Você completou 5 atendimentos e ganhou 50% de desconto no próximo serviço. O benefício é aplicado ao valor do serviço e não inclui a taxa de atendimento em domicílio.</p>
        <div className="customer-notice-actions">
          <button className="button button--secondary" type="button" onClick={() => setShowReward(false)}>Fechar</button>
          <Link className="button button--primary" href="/agendamento">Aproveitar meu benefício</Link>
        </div>
      </section>
    </div>
  );
}
