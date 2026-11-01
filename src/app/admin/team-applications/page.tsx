import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import TeamApplicationsInbox from "./team-applications-inbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team Applications | Samiz Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTeamApplicationsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <TeamApplicationsInbox />;
}
