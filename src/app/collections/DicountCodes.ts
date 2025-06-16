import type { CollectionConfig } from 'payload';

export const DiscountCodes: CollectionConfig = {
  slug: 'discountCodes',
  access: {
    read: () => true, // ✅ Anyone can read (for frontend validation)
    create: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser =
  req.user?.collection === 'users' && req.user.role === 'admin';
      return isLoggedInUser || isApiKey;
    },
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser =
  req.user?.collection === 'users' && req.user.role === 'admin';
      return isLoggedInUser || isApiKey;
    },
    delete: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser =
  req.user?.collection === 'users' && req.user.role === 'admin';
      return isLoggedInUser || isApiKey;
    },
  },
  fields: [
    {
      name: 'code',
      label: 'Discount Code',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        placeholder: 'e.g., GROVITA10',
      },
    },
    {
      name: 'discountPercent',
      label: 'Discount Percent',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      admin: {
        description: 'Percentage discount (1–100)',
      },
    },
    {
      name: 'maxUsageCount',
      label: 'Maximum Usage Count',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Maximum number of times this code can be used',
      },
    },
    {
      name: 'usedCount',
      label: 'Used Count',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this code has been used',
        readOnly: true,
      },
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Toggle to enable/disable this code',
      },
    },
    {
      name: 'notes',
      label: 'Admin Notes',
      type: 'textarea',
      admin: {
        description: 'Optional internal notes or campaign details',
      },
    },
  ],
};