import { Resend } from "resend";

type AssessmentEmailDetails = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyType: string;
  propertyLocation: string;
  assessmentDetails: string;
  paymentReference: string;
  trackingUrl: string;
};

type EmailResult =
  | { success: true }
  | { success: false; error: string };

function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const adminTo = process.env.ENGINEERING_ORDERS_ADMIN_EMAIL;

  if (!apiKey || !from || !adminTo) {
    throw new Error("Engineering assessment email configuration is incomplete.");
  }

  return { resend: new Resend(apiKey), from, adminTo };
}

export async function sendAssessmentNotification(
  type: "admin_alert" | "customer_confirmation",
  details: AssessmentEmailDetails,
): Promise<EmailResult> {
  try {
    const { resend, from, adminTo } = getEmailConfiguration();

    const isAdminAlert = type === "admin_alert";
    const recipient = isAdminAlert ? adminTo : details.customerEmail;

    const subject = isAdminAlert
      ? `Payment received: Engineering assessment ${details.orderId}`
      : "Payment confirmed — Samiz Tech Engineering assessment";

    const text = [
      isAdminAlert
        ? "A new engineering assessment payment has been verified."
        : `Hello ${details.customerName},`,
      "",
      isAdminAlert
        ? ""
        : "Your payment for the remote energy assessment has been confirmed.",
      `Order ID: ${details.orderId}`,
      `Customer: ${details.customerName}`,
      `Customer email: ${details.customerEmail}`,
      `Phone: ${details.customerPhone}`,
      `Property type: ${details.propertyType}`,
      `Property location: ${details.propertyLocation}`,
      "",
      "Assessment details:",
      details.assessmentDetails,
      "",
      "Amount paid: NGN 10,000",
      `Payment reference: ${details.paymentReference}`,
      `Track assessment: ${details.trackingUrl}`,
      "",
      isAdminAlert
        ? "Please review the order in the Samiz administration dashboard."
        : "Please keep your order ID and payment reference for your records.",
      "",
      "Samiz Tech Engineering",
      "Where Engineering Meets Energy",
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject,
      text,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Resend rejected the email.",
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error: "Resend did not return an email ID.",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown email delivery error.",
    };
  }
}
