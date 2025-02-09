import type { CollectionConfig } from 'payload';

export const PricePlans: CollectionConfig = {
  slug: "priceplans",
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
      update: ({ req: { user } }: any) => user?.role === 'admin' || user?.role === 'accountmanager',
      delete: () => false,
  },
  admin: {
    useAsTitle: "plan_title",
  },
  hooks: {
    beforeValidate: [
      ({ data = {}, req }) => { // ✅ `data` ko hamesha define rakha
        console.log("Before Validate - Incoming Data:", data);
        console.log("Logged-In User:", req.user);

        if (req.user?.role === "accountmanager") {
          if (!req.user.instituteId) {
            throw new Error("Account managers must have an associated institute.");
          }
          data.instituteId =
            typeof req.user.instituteId === "string"
              ? req.user.instituteId
              : req.user.instituteId?.id;
        }

        return data;
      },
    ],
    beforeChange: [
      ({ data = {}, req }) => { // ✅ `data` ko default empty object de diya
        console.log("Before Change - Modified Data:", data);

        if (req.user?.role === "accountmanager") {
          data.instituteId =
            typeof req.user.instituteId === "string"
              ? req.user.instituteId
              : req.user.instituteId?.id || data.instituteId;
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: "plan_title",
      type: "text",
      required: true,
      label: "Plan Title",
    },
    {
      name: "icon",
      type: "upload",
      relationTo: "media",
      label: "Plan Icon",
      required: false,
    },
    {
      name: "usp",
      type: "array",
      label: "Unique Selling Points",
      required: false,
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "price_usd",
      type: "number",
      label: "Price (USD)",
      required: true,
    },
    {
      name: "price_india",
      type: "number",
      label: "Price (INR)",
      required: true,
    },
    {
      name: "sale_price_usd",
      type: "number",
      label: "Sale Price (USD)",
      required: false,
    },
    {
      name: "sale_price_india",
      type: "number",
      label: "Sale Price (INR)",
      required: false,
    },
    {
      name: "isBestSeller",
      type: "checkbox",
      label: "Is Best Seller?",
      defaultValue: false,
    },
    {
      name: "instituteId",
      type: "relationship",
      relationTo: "institute",
      required: true,
      label: "Institute",
      admin: {
        position: "sidebar",
        condition: (_, { user }) => {
          return !!user?.instituteId || user?.role === "admin";
        },
      },
      hooks: {
        beforeValidate: [
          ({ data = {}, req }) => { // ✅ Again, `data` ko default value di
            console.log("Before Validate for InstituteId - PricePlans:", data);

            if (req.user?.role === "accountmanager") {
              data.instituteId =
                typeof req.user.instituteId === "string"
                  ? req.user.instituteId
                  : req.user.instituteId?.id || data.instituteId;
            }

            return data;
          },
        ],
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Active",
      defaultValue: true,
    },
  ],
};