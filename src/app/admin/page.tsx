import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Engineering Orders | Samiz Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}