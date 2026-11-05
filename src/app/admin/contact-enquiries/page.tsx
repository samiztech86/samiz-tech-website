import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import ContactEnquiriesInbox from "./contact-enquiries-inbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Enquiries | Samiz Admin",
  robots: { index: false, follow: false },
};

export default async function AdminContactEnquiriesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <ContactEnquiriesInbox />;
}
