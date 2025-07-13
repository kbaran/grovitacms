import type { CollectionConfig } from "payload";

export const MockTestSubmissions: CollectionConfig = {
  slug: "mocktestsubmissions",
  admin: {
    useAsTitle: "mockTestId",
    defaultColumns: ["userId", "mockTestId", "startTime", "status"],
    group: "Mock Tests",
  },
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;

      const { role, instituteId } = req.user;

      if (role === "admin") return true;

      if (role === "accountmanager" && instituteId) {
        const instituteIdValue = typeof instituteId === "string" ? instituteId : instituteId.id;
        if (instituteIdValue) {
          return { instituteId: { equals: instituteIdValue } };
        }
      }

      return false;
    },
    create: ({ req }) => {
      const authHeader = req?.headers?.get?.("authorization") || "";
      return authHeader.startsWith("API-Key ");
    },
    update: ({ req }) => {
      const authHeader = req?.headers?.get?.("authorization") || "";
      return authHeader.startsWith("API-Key ");
    },
    delete: () => false,
  },
  fields: [
    {
      name: "userId",
      type: "text",
      required: true,
    },
    {
      name: "mockTestId",
      type: "relationship",
      relationTo: "mocktests",
      required: true,
    },
    {
      name: "startTime",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: "endTime",
      type: "date",
      required: false,
    },
    {
      name: "status",
      type: "select",
      options: ["started", "in-progress", "submitted", "completed"],
      defaultValue: "started",
      required: true,
    },
    {
      name: "responses",
      type: "array",
      fields: [
        {
          name: "questionId",
          type: "text",
        },
        {
          name: "selectedOption",
          type: "text",
        },
        {
          name: "isCorrect",
          type: "checkbox",
        },
        {
          name: "timeSpent",
          type: "number",
        },
        {
          name: "submittedAt",
          type: "date", // ✅ already present — used for resume logic
        },
      ],
    },
    {
      name: "score",
      type: "number",
      required: false, // ✅ total score after test
    },
    {
      name: "resultSummary",
      type: "json",
      required: false, // ✅ final summary like accuracy, attempted, correct, incorrect, skipped
    },
  ],
};