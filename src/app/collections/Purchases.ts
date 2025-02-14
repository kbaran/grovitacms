import type { CollectionConfig } from "payload";

export const Purchases: CollectionConfig = {
  slug: "purchases",
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
      name: "course",
      type: "relationship",
      relationTo: "courses",
      required: true,
      label: "Purchased Course",
    },
    {
      name: "pricePlan",
      type: "relationship",
      relationTo: "priceplans",
      required: true,
      label: "Selected Price Plan",
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
      name: "razorpayOrderId",
      type: "text",
      required: false,
      label: "Razorpay Order ID",
    },
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
};