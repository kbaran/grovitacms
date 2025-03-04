import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const MockTests: CollectionConfig = {
  slug: 'mocktests',
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
    useAsTitle: 'title',
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
      name: 'examCategory',
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
    },
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'User ID',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',
    },
    {
      name: 'score',
      type: 'number',
      required: false,
      label: 'Score',
    },
    {
      name: 'questions',
      type: 'array',
      label: 'Mock Test Questions',
      required: true, // Each mock test must have associated questions
      fields: [
        {
          name: 'questionId',
          type: 'relationship',
          relationTo: 'mocktestquestions',
          required: true, // Ensures the question exists
          label: 'Question ID',
        },
      ],
    },
    {
      name: 'responses',
      type: 'array',
      label: 'User Responses',
      required: false, // Not required initially, added when user attempts test
      fields: [
        {
          name: 'questionId',
          type: 'relationship',
          relationTo: 'mocktestquestions',
          required: true, // Must exist if an answer is recorded
          label: 'Question ID',
        },
        {
          name: 'selectedAnswer',
          type: 'text',
          required: false, // Optional, user may skip a question
          label: 'User Selected Answer',
        },
        {
          name: 'timeTaken',
          type: 'number',
          required: false,
          label: 'Time Taken (seconds)',
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
  ],
};