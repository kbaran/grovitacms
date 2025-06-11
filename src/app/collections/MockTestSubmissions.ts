// collections/mocktestsubmissions.ts

import { CollectionConfig } from "payload";

export const MockTestSubmissions: CollectionConfig = {
  slug: "mocktestsubmissions",
  admin: {
    useAsTitle: "mockTestId",
    defaultColumns: ["mockTestId", "userId", "status", "startedAt", "submittedAt"],
    group: "Mock Tests",
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      return {
        userId: {
          equals: req.user?.id,
        },
      };
    },
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "mockTestId",
      type: "relationship",
      relationTo: "mocktests",
      required: true,
    },
    {
      name: "userId",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "startedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "submittedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "status",
      type: "select",
      options: ["in-progress", "completed", "expired"],
      defaultValue: "in-progress",
      required: true,
    },
    {
      name: "responses",
      type: "array",
      fields: [
        {
          name: "questionId",
          type: "relationship",
          relationTo: "mocktestquestions",
          required: true,
        },
        {
          name: "selectedOption",
          type: "text",
        },
        {
          name: "isCorrect",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "timeSpent",
          type: "number",
          min: 0,
        },
      ],
    },
    {
      name: "score",
      type: "number",
      min: 0,
    },
  ],
};