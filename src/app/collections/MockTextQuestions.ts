import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { Response, NextFunction } from 'express';
import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities'

export const MockTestQuestions: CollectionConfig = {
  slug: 'mocktestquestions',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return { instituteId: { equals: typeof instituteId === 'string' ? instituteId : instituteId.id } };
      }
      return false;
    },
    create: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
    update: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
    delete: () => false,
  },
  admin: {
    useAsTitle: 'question',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};

        if (req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId =
            typeof req.user.instituteId === 'string' ? req.user.instituteId : req.user.instituteId?.id;
        }

        // ✅ Set Default Exam Category ID if not provided
        if (!data.examCategoryId) {
          data.examCategoryId = "67c43634c7d89d6e4da15d11";
        }

        return data;
      },
    ],
  },
  
  fields: [
    {
      name: 'question',
      type: 'code',
      required: true,
      label: 'Question (LaTeX Encoded)',
      admin: {
        language: 'latex',
      },
    },
    {
      name: 'questionimage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Question Image',
    },
    {
      name: 'answers',
      type: 'array',
      label: 'Answers',
      fields: [
        {
          name: 'answerText',
          type: 'code',
          required: false,
          label: 'Answer Text (LaTeX Encoded)',
          admin: {
            language: 'latex',
          },
        },
        {
          name: 'answerImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: 'Answer Image',
        },
        {
          name: 'isCorrect',
          type: 'checkbox',
          required: true,
          label: 'Is Correct Answer?',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'examCategoryId',  // ✅ Relationship with ExamCategory
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
      defaultValue: "67c43634c7d89d6e4da15d11", // ✅ Default value set
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Subject',
    },
    {
      name: 'topicsCovered',
      type: 'array',
      label: 'Topics Covered',
      fields: [
        {
          name: 'topic',
          type: 'text',
        },
      ],
    },
    {
      name: 'difficulty',
      type: 'select',
      label: 'Difficulty',
      options: [
        { label: "Easy", value: "easy" },
        { label: "Medium", value: "medium" },
        { label: "Hard", value: "hard" },
        { label: "Very Hard", value: "very-hard" },
      ]
    },
    {
      name: 'attempts',
      type: 'number',
      label: 'No. Of Attempts',
      defaultValue: 0,
    },
  ],
  endpoints: [
    {
      path: "/next-question",
      method: "get",
      handler: async (req: any) => {
        try {
          const payload = req.payload;

          // ✅ Get previously attempted question IDs from query params
          const attemptedQuestions = req.query.attempted ? JSON.parse(req.query.attempted) : [];

          // ✅ Fetch ALL questions excluding attempted ones
          const allQuestions = await payload.find({
            collection: "mocktestquestions",
            where: {
              id: {
                not_in: attemptedQuestions,
              },
            },
            limit: 1000, // ✅ Fetch more questions to ensure randomness
          });

          if (!allQuestions.docs || allQuestions.docs.length === 0) {
            return Response.json(
              { message: `No results found`, result: null },
              {
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type',
                },
              }
            );
          }

          // ✅ Select a truly random question
          const randomIndex = Math.floor(Math.random() * allQuestions.docs.length);
          const randomQuestion = allQuestions.docs[randomIndex];

          return Response.json(
            { message: `Next question fetched!`, result: randomQuestion },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
              },
            }
          );
        } catch (error) {
          console.error("❌ Error fetching next question:", error);
          return Response.json(
            { message: `Error fetching question`, error:error },
            { status: 500 }
          );
        }
      },
    },
  ],
};

export default MockTestQuestions;