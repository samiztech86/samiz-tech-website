import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { getBillingPlan } from "@/lib/billing";
import { supabaseServer } from "@/lib/supabase/server";

type PaystackEvent = {
  event?: string;
  data?: any;
};

function getSamizPlanFromCode(
  planCode: string | undefined,
) {
  if (!planCode) {
    return null;
  }

  for (const planId of [
    "starter",
    "pro",
    "business",
  ] as const) {
    const plan = getBillingPlan(planId);

    if (plan?.paymentPlanId === planCode) {
      return plan;
    }
  }

  return null;
}

function getPlanFromMetadata(metadata: any) {
  if (
    !metadata ||
    metadata.product !== "samiz-energy-tools"
  ) {
    return null;
  }

  return getBillingPlan(
    typeof metadata.plan === "string"
      ? metadata.plan
      : "",
  );
}

function getCustomerName(
  customer: any,
  metadata: any,
): string {
  if (
    typeof metadata?.customer_name === "string" &&
    metadata.customer_name.trim()
  ) {
    return metadata.customer_name.trim();
  }

  const firstName =
    typeof customer?.first_name === "string"
      ? customer.first_name.trim()
      : "";

  const lastName =
    typeof customer?.last_name === "string"
      ? customer.last_name.trim()
      : "";

  return (
    `${firstName} ${lastName}`.trim() ||
    "Samiz Energy Tools Customer"
  );
}

function getCustomerEmail(
  data: any,
  metadata: any,
): string {
  const email =
    typeof data?.customer?.email === "string"
      ? data.customer.email
      : typeof data?.email === "string"
        ? data.email
        : typeof metadata?.customer_email === "string"
          ? metadata.customer_email
          : "";

  return email.trim().toLowerCase();
}

function getCustomerPhone(
  data: any,
  metadata: any,
): string | null {
  const phone =
    typeof metadata?.customer_phone === "string"
      ? metadata.customer_phone.trim()
      : typeof data?.customer?.phone === "string"
        ? data.customer.phone.trim()
        : "";

  return phone || null;
}

function getSubscriptionData(data: any) {
  return data?.subscription ?? data;
}

function toIsoDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === "string") {
    const timestamp = new Date(value).getTime();

    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }

  return null;
}

async function saveSubscriptionByEmail(
  email: string,
  subscription: Record<string, unknown>,
) {
  const { data: existing, error: lookupError } =
    await supabaseServer
      .from("energy_tool_subscriptions")
      .select("id")
      .eq("customer_email", email)
      .maybeSingle();

  if (lookupError) {
    return {
      data: null,
      error: lookupError,
    };
  }

  if (existing?.id) {
    const { data, error } =
      await supabaseServer
        .from("energy_tool_subscriptions")
        .update(subscription)
        .eq("id", existing.id)
        .select()
        .single();

    return {
      data,
      error,
    };
  }

  const { data, error } =
    await supabaseServer
      .from("energy_tool_subscriptions")
      .insert({
        customer_email: email,
        ...subscription,
      })
      .select()
      .single();

  return {
    data,
    error,
  };
}

export async function POST(request: NextRequest) {
  try {
    const secretKey =
      process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook is not configured.",
        },
        { status: 500 },
      );
    }

    const rawBody = await request.text();

    const signature = request.headers.get(
      "x-paystack-signature",
    );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Paystack signature.",
        },
        { status: 401 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    const signatureBuffer =
      Buffer.from(signature, "utf8");

    const expectedBuffer =
      Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !==
        expectedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Paystack signature.",
        },
        { status: 401 },
      );
    }

    const event =
      JSON.parse(rawBody) as PaystackEvent;

    const data = event.data ?? {};
    const metadata = data.metadata;

    console.log(
      "Paystack webhook received:",
      {
        event: event.event,
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
      },
    );

    /*
     * A new Samiz recurring subscription.
     */
    if (event.event === "subscription.create") {
      const subscription =
        getSubscriptionData(data);

      const plan =
        getSamizPlanFromCode(
          subscription?.plan?.plan_code ??
            data?.plan?.plan_code,
        );

      if (!plan) {
        console.log(
          "Ignoring subscription.create for a non-Samiz plan.",
        );

        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const customer =
        data?.customer ?? {};

      const email =
        getCustomerEmail(
          data,
          metadata,
        );

      if (!email) {
        console.error(
          "Samiz subscription webhook has no customer email.",
        );

        return NextResponse.json(
          {
            error:
              "Customer email missing.",
          },
          { status: 400 },
        );
      }

      const subscriptionCode =
        typeof subscription?.subscription_code ===
        "string"
          ? subscription.subscription_code
          : null;

      const emailToken =
        typeof subscription?.email_token ===
        "string"
          ? subscription.email_token
          : null;

      const nextPaymentAt =
        toIsoDate(
          subscription?.next_payment_date,
        );

      const startedAt =
        toIsoDate(
          subscription?.createdAt ??
            subscription?.created_at,
        );

      const { error } =
        await saveSubscriptionByEmail(
          email,
          {
            customer_name:
              getCustomerName(
                customer,
                metadata,
              ),
            customer_phone:
              getCustomerPhone(
                data,
                metadata,
              ),
            plan: plan.id,
            status: "active",
            paystack_customer_code:
              typeof customer?.customer_code ===
              "string"
                ? customer.customer_code
                : null,
            paystack_subscription_code:
              subscriptionCode,
            paystack_email_token:
              emailToken,
            subscription_started_at:
              startedAt,
            subscription_next_payment_at:
              nextPaymentAt,
            updated_at:
              new Date().toISOString(),
          },
        );

      if (error) {
        console.error(
          "Failed to save Samiz subscription:",
          error,
        );

        return NextResponse.json(
          {
            error:
              "Unable to save subscription.",
          },
          { status: 500 },
        );
      }

      console.log(
        "Samiz subscription saved:",
        {
          email,
          plan: plan.id,
          subscriptionCode,
        },
      );
    }

    /*
     * Successful initial or recurring payment.
     */
    if (event.event === "charge.success") {
      const plan =
        getPlanFromMetadata(
          metadata,
        );

      const email =
        getCustomerEmail(
          data,
          metadata,
        );

      if (!plan && !email) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      if (plan && email) {
        const { error } =
          await saveSubscriptionByEmail(
            email,
            {
              plan: plan.id,
              status: "active",
              last_payment_reference:
                typeof data.reference ===
                "string"
                  ? data.reference
                  : null,
              last_payment_at:
                toIsoDate(
                  data.paid_at ??
                    data.created_at,
                ),
              updated_at:
                new Date().toISOString(),
            },
          );

        if (error) {
          console.error(
            "Failed to update Samiz successful payment:",
            error,
          );

          return NextResponse.json(
            {
              error:
                "Unable to update payment.",
            },
            { status: 500 },
          );
        }
      }

      console.log(
        "Samiz payment successful:",
        data.reference,
      );
    }

    /*
     * Recurring payment failed.
     */
    if (
      event.event ===
      "invoice.payment_failed"
    ) {
      const customer =
        data?.customer ?? {};

      const email =
        getCustomerEmail(
          data,
          customer?.metadata,
        );

      if (email) {
        const { error } =
          await saveSubscriptionByEmail(
            email,
            {
              status: "past_due",
              updated_at:
                new Date().toISOString(),
            },
          );

        if (error) {
          console.error(
            "Failed to mark Samiz subscription past due:",
            error,
          );

          return NextResponse.json(
            {
              error:
                "Unable to update subscription.",
            },
            { status: 500 },
          );
        }
      }
    }

    /*
     * Customer has requested that the subscription
     * should not renew.
     */
    if (
      event.event ===
      "subscription.not_renew"
    ) {
      const subscription =
        getSubscriptionData(data);

      const subscriptionCode =
        subscription?.subscription_code;

      if (
        typeof subscriptionCode ===
        "string"
      ) {
        const { error } =
          await supabaseServer
            .from(
              "energy_tool_subscriptions",
            )
            .update({
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "paystack_subscription_code",
              subscriptionCode,
            );

        if (error) {
          console.error(
            "Failed to update non-renewing Samiz subscription:",
            error,
          );

          return NextResponse.json(
            {
              error:
                "Unable to update subscription.",
            },
            { status: 500 },
          );
        }
      }
    }

    /*
     * Subscription is fully disabled/cancelled.
     */
    if (
      event.event ===
      "subscription.disable"
    ) {
      const subscription =
        getSubscriptionData(data);

      const subscriptionCode =
        subscription?.subscription_code;

      if (
        typeof subscriptionCode ===
        "string"
      ) {
        const { error } =
          await supabaseServer
            .from(
              "energy_tool_subscriptions",
            )
            .update({
              status: "cancelled",
              subscription_cancelled_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "paystack_subscription_code",
              subscriptionCode,
            );

        if (error) {
          console.error(
            "Failed to disable Samiz subscription:",
            error,
          );

          return NextResponse.json(
            {
              error:
                "Unable to disable subscription.",
            },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Paystack webhook processing failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 },
    );
  }
}
