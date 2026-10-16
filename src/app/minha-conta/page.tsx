import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CustomerDashboard from "./CustomerDashboard";

async function ProtectedDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fminha-conta");
  return <CustomerDashboard />;
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={<main className="account-page"><div className="container account-shell"><p className="booking-muted">Carregando sua conta…</p></div></main>}>
      <ProtectedDashboard />
    </Suspense>
  );
}
