"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notice = "reward" | "suspended" | null;

export default function LoyaltyHomeNotice() {
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [statusResponse, bookingsResponse] = await Promise.all([
          fetch("/api/platform-status", { cache: "no-store" }),
          fetch("/api/customer/bookings", { cache: "no-store" }),
        ]);
        const status = statusResponse.ok ? await statusResponse.json() : null;
        const data = bookingsResponse.ok ? await bookingsResponse.json() : null;
        if (!active) return;

        if (status?.loyalty?.enabled === false) {
          const version = status.loyalty.updatedAt ?? "disabled";
          const key = `nbs-loyalty-suspended-${version}`;
          if (window.localStorage.getItem(key) !== "seen") {
            setNotice("suspended");
            window.localStorage.setItem(key, "seen");
            return;
          }
        }

        const rewardsAvailable = data?.loyalty?.rewardsAvailable ?? 0;
        const rewardsEarned = data?.loyalty?.rewardsEarned ?? 0;
        const rewardKey = `nbs-loyalty-reward-${rewardsEarned}`;
        if (data?.loyalty?.enabled !== false && rewardsAvailable > 0 && window.localStorage.getItem(rewardKey) !== "seen") {
          setNotice("reward");
          window.localStorage.setItem(rewardKey, "seen");
        }
      } catch {
        // A página inicial continua disponível mesmo se a conta não puder ser consultada.
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (!notice) return null;

  return (
    <div className="customer-notice-backdrop" role="presentation">
      <section className={notice === "reward" ? "customer-notice customer-notice--loyalty" : "customer-notice"} role="alertdialog" aria-modal="true" aria-labelledby="home-loyalty-title">
        <button type="button" onClick={() => setNotice(null)} aria-label="Fechar">×</button>
        <p className="eyebrow">{notice === "reward" ? "RECOMPENSA DE FIDELIDADE" : "AVISO IMPORTANTE"}</p>
        {notice === "reward" && <div className="customer-notice-gift" aria-hidden="true">50%</div>}
        <h2 id="home-loyalty-title">{notice === "reward" ? "Você conquistou 50% de desconto!" : "Programa de fidelidade temporariamente pausado"}</h2>
        <p>{notice === "reward"
          ? "Parabéns! Você completou 5 atendimentos e ganhou 50% de desconto no próximo serviço. O benefício é aplicado ao valor do serviço e não inclui a taxa de atendimento em domicílio."
          : "O programa de fidelidade está temporariamente indisponível. Seu histórico e os pontos acumulados continuam preservados. Avisaremos quando o recurso estiver disponível novamente."}</p>
        <div className="customer-notice-actions">
          <button className="button button--secondary" type="button" onClick={() => setNotice(null)}>Fechar</button>
          {notice === "reward" && <Link className="button button--primary" href="/agendamento">Aproveitar meu benefício</Link>}
        </div>
      </section>
    </div>
  );
}
