import type { CollectionConfig } from "payload";

export const MockTestPurchases: CollectionConfig = {
  slug: "mocktestpurchases",
  access: {
    read: ({ req }: any) => {
        if (!req.user) return true;
        const { role, instituteId } = req.user;
        if (role === 'admin') return true;
        if (role === 'accountmanager' && instituteId) {
          const instituteIdValue = typeof instituteId === 'string' ? instituteId : instituteId.id;
          if (instituteIdValue) {
            return { instituteId: { equals: instituteIdValue } };
          }
        }
        return false;
      },
      create: ({ req: { user } }: any) => user?.role === 'admin' || user?.role === 'accountmanager',
      update: ({ req: { user } }: any) => {
        console.log("🔍 Update Request User:", user); // Debugging log
        return user?.role === "admin" || user?.role === "accountmanager";
      },
      delete: () => false,
  },
  admin: { useAsTitle: "id" },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      label: "User",
    },
    {
      name: "examCategory",
      type: "relationship",
      relationTo: "examcategories",
      required: true,
      label: "Purchased Exam Category",
    },
    {
      name: "amountPaid",
      type: "number",
      required: true,
      label: "Amount Paid",
    },
    {
      name: "currency",
      type: "select",
      options: [
        { label: "INR", value: "INR" },
        { label: "USD", value: "USD" },
      ],
      defaultValue: "INR",
      required: true,
      label: "Currency",
    },
    {
      name: "paymentStatus",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Success", value: "success" },
        { label: "Failed", value: "failed" },
      ],
      defaultValue: "pending",
      required: true,
      label: "Payment Status",
    },
    {
      name: "paymentType",
      type: "select",
      options: [
        { label: "One-Time", value: "one-time" },
        { label: "Recurring", value: "recurring" },
      ],
      defaultValue: "one-time",
      required: true,
      label: "Payment Type",
    },
    // Standard one-time payment fields
    {
      name: "razorpayOrderId",
      type: "text",
      required: false,
      label: "Razorpay Order ID",
      admin: {
        condition: (data) => data.paymentType === 'one-time' || !data.paymentType
      }
    },
    // Subscription related fields
    {
      name: "razorpaySubscriptionId",
      type: "text",
      required: false,
      label: "Razorpay Subscription ID",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "razorpayPlanId",
      type: "text",
      required: false,
      label: "Razorpay Plan ID",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "subscriptionStatus",
      type: "select",
      options: [
        { label: "Created", value: "created" },
        { label: "Authenticated", value: "authenticated" },
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Halted", value: "halted" },
        { label: "Failed", value: "failed" },
        { label: "Completed", value: "completed" },
        { label: "Expired", value: "expired" },
      ],
      required: false,
      label: "Subscription Status",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "subscriptionStartDate",
      type: "date",
      required: false,
      label: "Subscription Start Date",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "subscriptionEndDate",
      type: "date",
      required: false,
      label: "Subscription End Date",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "currentPeriodStart",
      type: "date",
      required: false,
      label: "Current Period Start",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "currentPeriodEnd",
      type: "date",
      required: false,
      label: "Current Period End",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "nextPaymentAttempt",
      type: "date",
      required: false,
      label: "Next Payment Attempt",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "failedPaymentCount",
      type: "number",
      defaultValue: 0,
      required: false,
      label: "Failed Payment Count",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "totalCycles",
      type: "number",
      required: false,
      label: "Total Billing Cycles",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "completedCycles",
      type: "number",
      defaultValue: 0,
      required: false,
      label: "Completed Billing Cycles",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "billingCycle",
      type: "select",
      options: [
        { label: "Monthly", value: "monthly" },
        { label: "Quarterly", value: "quarterly" },
        { label: "Semi-Annual", value: "semi-annual" },
        { label: "Annual", value: "annual" },
      ],
      required: false,
      label: "Billing Cycle",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      }
    },
    {
      name: "cancellationReason",
      type: "text",
      required: false,
      label: "Cancellation Reason",
      admin: {
        condition: (data) => data.paymentType === 'recurring' && ['cancelled', 'halted'].includes(data.subscriptionStatus)
      }
    },
    {
      name: "cancellationDate",
      type: "date",
      required: false,
      label: "Cancellation Date",
      admin: {
        condition: (data) => data.paymentType === 'recurring' && ['cancelled', 'halted'].includes(data.subscriptionStatus)
      }
    },
    // Payment history for recurring payments
    {
      name: "paymentHistory",
      type: "array",
      label: "Payment History",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      },
      fields: [
        {
          name: "paymentId",
          type: "text",
          required: true,
          label: "Razorpay Payment ID"
        },
        {
          name: "amount",
          type: "number",
          required: true,
          label: "Amount"
        },
        {
          name: "status",
          type: "select",
          options: [
            { label: "Success", value: "success" },
            { label: "Failed", value: "failed" },
            { label: "Refunded", value: "refunded" },
          ],
          required: true,
          label: "Status"
        },
        {
          name: "paymentDate",
          type: "date",
          required: true,
          label: "Payment Date"
        },
        {
          name: "billingPeriodStart",
          type: "date",
          required: false,
          label: "Billing Period Start"
        },
        {
          name: "billingPeriodEnd",
          type: "date",
          required: false,
          label: "Billing Period End"
        },
        {
          name: "notes",
          type: "text",
          required: false,
          label: "Notes"
        }
      ]
    },
    // User's payment method information
    {
      name: "paymentMethod",
      type: "group",
      label: "Payment Method",
      admin: {
        condition: (data) => data.paymentType === 'recurring'
      },
      fields: [
        {
          name: "method",
          type: "select",
          options: [
            { label: "Credit Card", value: "credit_card" },
            { label: "Debit Card", value: "debit_card" },
            { label: "UPI", value: "upi" },
            { label: "Net Banking", value: "netbanking" },
            { label: "Wallet", value: "wallet" },
            { label: "Other", value: "other" }
          ],
          required: false,
          label: "Method Type"
        },
        {
          name: "last4",
          type: "text",
          required: false,
          label: "Last 4 digits"
        },
        {
          name: "network",
          type: "text",
          required: false,
          label: "Card Network"
        },
        {
          name: "expiryMonth",
          type: "number",
          required: false,
          label: "Expiry Month",
          admin: {
            condition: (data) => data.method === 'credit_card' || data.method === 'debit_card'
          }
        },
        {
          name: "expiryYear",
          type: "number",
          required: false,
          label: "Expiry Year",
          admin: {
            condition: (data) => data.method === 'credit_card' || data.method === 'debit_card'
          }
        }
      ]
    },
    // Common fields for both payment types
    {
      name: "razorpayPaymentId",
      type: "text",
      required: false,
      label: "Razorpay Payment ID",
    },
    {
      name: "razorpaySignature",
      type: "text",
      required: false,
      label: "Razorpay Signature",
    },
    {
      name: "notes",
      type: "json",
      label: "Additional Data",
      admin: {
        description: "Additional data or notes related to this purchase/subscription"
      }
    },
    {
      name: "redirectPath",
      type: "text",
      required: false,
      label: "Redirect Path",
      admin: {
        description: "Path to redirect after payment completion"
      }
    },
    {
      name: "createdAt",
      type: "date",
      admin: { position: "sidebar" },
    },
  ],
  endpoints: [
    // ADD PURCHASE ENDPOINT
    {
      path: '/add-purchase',
      method: 'post',
      handler: async (req: any) => {
        try {
          const data = await req?.json();
          
          // Validate required fields
          if (!data.user) {
            return new Response(
              JSON.stringify({ error: "User ID is required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          if (!data.examCategory) {
            return new Response(
              JSON.stringify({ error: "Exam Category ID is required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          // Create the purchase in the collection
          const purchase = await req.payload.create({
            collection: 'mocktestpurchases',
            data: data,
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Purchase successfully created!`, 
              result: data, 
              purchaseId: purchase.id 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        } catch (error) {
          console.error("Error creating purchase:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to create purchase" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      },
    },
    // UPDATE PURCHASE ENDPOINT
    {
      path: '/update-purchase/:id',
      method: 'patch',
      handler: async (req: any) => {
        try {
          const url = new URL(req.url);
          const pathParts = url.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          const data = await req?.json();
          
          if (!id) {
            return new Response(
              JSON.stringify({ error: "Purchase ID is required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          // Update the purchase
          const updatedPurchase = await req.payload.update({
            collection: 'mocktestpurchases',
            id: id,
            data: data,
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Purchase successfully updated!`, 
              result: data, 
              purchase: updatedPurchase 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        } catch (error) {
          console.error("Error updating purchase:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to update purchase" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      },
    },
    // RECORD SUBSCRIPTION PAYMENT ENDPOINT
    {
      path: '/record-subscription-payment/:id',
      method: 'post',
      handler: async (req: any) => {
        try {
          const url = new URL(req.url);
          const pathParts = url.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          const data = await req?.json();
          
          if (!id) {
            return new Response(
              JSON.stringify({ error: "Purchase ID is required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          if (!data.paymentId || !data.amount || !data.status) {
            return new Response(
              JSON.stringify({ error: "Payment ID, amount, and status are required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          // First, get the existing purchase
          const existingPurchase = await req.payload.findByID({
            collection: 'mocktestpurchases',
            id: id
          });
          
          if (!existingPurchase) {
            return new Response(
              JSON.stringify({ error: "Purchase not found" }),
              { 
                status: 404,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            );
          }
          
          // Create payment history entry
          const paymentEntry = {
            paymentId: data.paymentId,
            amount: data.amount,
            status: data.status,
            paymentDate: data.paymentDate || new Date().toISOString(),
            billingPeriodStart: data.billingPeriodStart,
            billingPeriodEnd: data.billingPeriodEnd,
            notes: data.notes
          };
          
          // Prepare update data
          const updateData: any = {
            paymentHistory: [...(existingPurchase.paymentHistory || []), paymentEntry]
          };
          
          // Update subscription fields if provided
          if (data.currentPeriodStart) updateData.currentPeriodStart = data.currentPeriodStart;
          if (data.currentPeriodEnd) updateData.currentPeriodEnd = data.currentPeriodEnd;
          if (data.nextPaymentAttempt) updateData.nextPaymentAttempt = data.nextPaymentAttempt;
          if (data.subscriptionStatus) updateData.subscriptionStatus = data.subscriptionStatus;
          
          // Increment completed cycles if successful payment
          if (data.status === 'success') {
            updateData.completedCycles = (existingPurchase.completedCycles || 0) + 1;
            // Reset failed payment count on successful payment
            updateData.failedPaymentCount = 0;
          } else if (data.status === 'failed') {
            // Increment failed payment count
            updateData.failedPaymentCount = (existingPurchase.failedPaymentCount || 0) + 1;
          }
          
          // Update the purchase with the new payment history
          const updatedPurchase = await req.payload.update({
            collection: 'mocktestpurchases',
            id: id,
            data: updateData
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Payment record added successfully!`, 
              purchase: updatedPurchase 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        } catch (error) {
          console.error("Error recording subscription payment:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to record payment" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    },
    // CANCEL SUBSCRIPTION ENDPOINT
    {
      path: '/cancel-subscription/:id',
      method: 'post',
      handler: async (req: any) => {
        try {
          const url = new URL(req.url);
          const pathParts = url.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          const data = await req?.json();
          
          if (!id) {
            return new Response(
              JSON.stringify({ error: "Purchase ID is required" }),
              { 
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
              }
            );
          }
          
          // Update the subscription status
          const updatedPurchase = await req.payload.update({
            collection: 'mocktestpurchases',
            id: id,
            data: {
              subscriptionStatus: 'cancelled',
              cancellationReason: data.reason || 'User requested cancellation',
              cancellationDate: new Date().toISOString()
            }
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Subscription cancelled successfully!`, 
              purchase: updatedPurchase 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        } catch (error) {
          console.error("Error cancelling subscription:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to cancel subscription" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    }
  ]
};