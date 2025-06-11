import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const MockTestEnrollments: CollectionConfig = {
  slug: 'mocktestenrollments',
  access: {
    read: () => true, // ✅ Anyone can read users
    create: () => true, // ✅ Allow user creation without login (important!)
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
    delete: () => false, // ✅ No one can delete users
  },
  admin: {
    useAsTitle: 'mockTestId',
    defaultColumns: ['userId', 'mockTestId', 'pricePaid'],
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
      name: 'pricePaid',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'G-Coins Paid',
    },
    {
      name: 'enrolledAt',
      type: 'date',
      defaultValue: () => new Date(),
      admin: { position: 'sidebar' },
    },
  ],
};

export default MockTestEnrollments;