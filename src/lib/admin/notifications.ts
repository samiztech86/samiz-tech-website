import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { sendMarketplaceEventNotifications } from "@/lib/email/marketplace";

export type AdminNotificationEvent =
  | "supplier_registered"
  | "product_submitted"
  | "support_message"
  | "marketplace_event";

type AdminNotificationInput = {
  eventType: AdminNotificationEvent;
  title: string;
  message: string;
  entityType?: "supplier" | "product" | "support_conversation" | "other";
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  emailSubject?: string;
  emailLines?: string[];
};

export async function createAdminNotification(
  input: AdminNotificationInput,
): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from("admin_notifications")
      .insert({
        event_type: input.eventType,
        title: input.title,
        message: input.message,
        entity_type: input.entityType ?? "other",
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
      });

    if (error) {
      console.error("Admin notification could not be saved:", error.message);
    }
  } catch (error) {
    console.error(
      "Admin notification persistence failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  try {
    const result = await sendMarketplaceEventNotifications({
      recipientEmails: [],
      subject: input.emailSubject ?? input.title,
      adminSubject: input.emailSubject ?? input.title,
      lines: input.emailLines ?? [
        input.title,
        "",
        input.message,
        input.entityId ? `Reference: ${input.entityId}` : "",
        `Event type: ${input.eventType}`,
      ].filter(Boolean),
    });

    if (!result.success) {
      console.error("Admin notification email failed:", result.error);
    }
  } catch (error) {
    console.error(
      "Admin notification email threw an error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
