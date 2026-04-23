import { redirect } from "next/navigation";

export default function DashboardAgentPage() {
  redirect("/dashboard/threads/tonight-plans");
}
