import type { CollectionConfig } from 'payload';

export const Questions: CollectionConfig = {
  slug: "questions",
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;

      const { role, instituteId } = user;

      if (role === "admin") {
        return true;
      }

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
    create: ({ req: { user } }) => {
      return user?.role === "admin" || user?.role === "accountmanager";
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin" || user?.role === "accountmanager") return true;
      return false;
    },
    delete: () => false,
  },
  admin: {
    useAsTitle: "question",
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        console.log("Before Validate - Incoming Data:", data);
        console.log("Logged-In User:", req.user);

        // Ensure data exists
        data ??= {};

        if (req.user?.collection === 'users' && req.user.role === 'accountmanager') {
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

        // Ensure data exists
        data ??= {};

        if (req.user?.collection === 'users' && req.user.role === 'accountmanager') {
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
      name: "course",
      type: "relationship",
      relationTo: "courses",
      required: true,
      label: "Related Course",
    },
    {
      name: "module",
      type: "relationship",
      relationTo: "course-modules",
      required: false,
      label: "Related Module",
      admin: {
        condition: (data, siblingData) => !!siblingData?.course,
      },
    },
    {
      name: "question",
      type: "text",
      required: true,
      label: "Question Text",
    },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Single Choice", value: "single-choice" },
        { label: "Multiple Choice", value: "multi-choice" },
        { label: "Text", value: "text" },
      ],
      required: true,
      label: "Question Type",
    },
    {
      name: "options",
      type: "array",
      admin: {
        condition: (data) =>
          data.type === "single-choice" || data.type === "multi-choice",
      },
      fields: [
        {
          name: "option",
          type: "text",
          required: true,
        },
        {
          name: "isCorrect",
          type: "checkbox",
        },
      ],
    },
    {
      name: "correctAnswer",
      type: "text",
      admin: {
        condition: (data) => data.type === "text",
      },
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
            console.log("Before Validate for InstituteId - Questions:", data);

            data ??= {};

            if (req.user?.collection === 'users' && req.user.role === 'accountmanager') {
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