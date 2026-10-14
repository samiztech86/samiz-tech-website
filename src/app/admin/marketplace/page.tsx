import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import MarketplaceDashboard from "./marketplace-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Moderation | Samiz Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMarketplacePage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <MarketplaceDashboard />;
}
