import { isAdminOrManager } from "@/access/isAdminOrManager";
import type { CollectionConfig } from "payload";

export const Widget1: CollectionConfig = {
  slug: "widget1",
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;

      const { role, instituteId } = req.user;

      if (role === "admin") return true;

      if (role === "accountmanager" && instituteId) {
        const instituteIdValue =
          typeof instituteId === "string" ? instituteId : instituteId.id;

        if (instituteIdValue) {
          return {
            instituteId: {
              equals: instituteIdValue,
            },
          };
        }
      }

      return false;
    },
    create: ({ req: { user } }: any) => {
      return user?.role === "admin" || user?.role === "accountmanager";
    },
    update: ({ req: { user } }: any) => {
      if (!user) return false;

      if (user.role === "admin") return true;

      if (user.role === "accountmanager") {
        return true;
      }

      return false;
    },
    delete: () => false,
  },
  admin: {
    useAsTitle: "title",
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};

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
      ({ data, req }) => {
        console.log("Before Change - Modified Data:", data);

        data ??= {};

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
      name: "title",
      type: "text",
      required: true,
      label: "Title",
    },
    {
      name: "bgcolor",
      type: "text",
      required: true,
      label: "Background/Gradient Color",
      defaultValue: "#FFFFFF", // Default value for bgcolor
    },
    {
      name: "bgcolor1",
      type: "text",
      required: false,
      label: "Gradient Color",
      defaultValue: "#FFFFFF", // Default value for bgcolor
    },
    {
      name: "ctatext",
      type: "text",
      required: false,
      label: "CTA Label",
    },
    {
      name: "targeturl",
      type: "text",
      required: false,
      label: "Target URL",
    },
    {
      name: "active",
      type: "checkbox",
      label: "Active",
      defaultValue: true,
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
          ({ data, req }) => {
            data ??= {};

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
      name: "blocks",
      type: "array",
      label: "Blocks",
      fields: [
        {
          name: "block_title",
          type: "text",
          required: true,
          label: "Block Title",
        },
        {
          name: "block_subtext",
          type: "textarea",
          required: false,
          label: "Block Subtext",
        },
        {
          name: "block_image",
          type: "upload",
          relationTo: "media",
          required: false,
          label: "Block Image",
          admin: {
            description: "Upload an image for the block.",
          },
        },
      ],
    },
  ],
};