import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import SupportInbox from "./support-inbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Inbox | Samiz Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSupportPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <SupportInbox />;
}
