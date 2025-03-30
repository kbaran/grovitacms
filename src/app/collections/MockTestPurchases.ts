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
    // {
    //   name: "pricePlan",
    //   type: "relationship",
    //   relationTo: "priceplans",
    //   required: true,
    //   label: "Selected Price Plan",
    // },
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
      name: "subscriptionStatus",
      type: "select",
      options: [
        { label: "Created", value: "created" },
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Halted", value: "halted" },
        { label: "Failed", value: "failed" },
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
    }
  ]
};