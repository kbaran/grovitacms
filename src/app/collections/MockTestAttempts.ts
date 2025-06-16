import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const MockTestAttempts: CollectionConfig = {
  slug: 'mocktestattempts',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false;
      if (req.user.role === 'admin' || req.user.role === 'accountmanager') return true;
      return { userId: { equals: req.user.id } };
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => false,
    delete: ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'admin',
  },
  admin: {
    useAsTitle: 'mockTestId',
    defaultColumns: ['userId', 'mockTestId', 'score', 'startedAt'],
    group: 'Mock Tests',
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'mockTestId',
      type: 'text',
      required: true,
      label: 'Mock Test ID',
    },
    {
      name: 'score',
      type: 'number',
      required: false,
      label: 'Final Score',
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: { position: 'sidebar' },
    },
    {
      name: 'completedAt',
      type: 'date',
      required: false,
      label: 'Completed At',
    },
  ],
};

export default MockTestAttempts;