import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

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
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'mocktestId',
      type: 'relationship',
      relationTo: 'mocktests',
      required: true,
      label: 'Mock Test',
    },
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
          required: true,
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
      ],
    },
    {
      name: 'correctAnswer',
      type: 'code',
      required: true,
      label: 'Correct Answer (LaTeX Encoded)',
      admin: {
        language: 'latex',
      },
    },
    {
      name: 'answer',
      type: 'code',
      required: false,
      label: 'Detailed Answer Explanation (LaTeX Encoded)',
      admin: {
        language: 'latex',
      },
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
};