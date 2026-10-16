import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CustomerDashboard from "./CustomerDashboard";

export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fminha-conta");
  return <CustomerDashboard />;
}
