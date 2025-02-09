import type { CollectionConfig } from 'payload';

export const PricePlans: CollectionConfig = {
  slug: 'price_plans',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return { instituteId: { equals: instituteId.id || instituteId } };
      }
      return false;
    },
    create: ({ req }: any) => req.user?.role === 'admin' || req.user?.role === 'accountmanager',
    update: ({ req }: any) => req.user?.role === 'admin' || req.user?.role === 'accountmanager',
    delete: () => false,
  },
  admin: {
    useAsTitle: 'plan_title',
    hidden: ({ user }) => {
      return !(user?.role === 'admin' || user?.role === 'accountmanager');
    },
  },
  hooks: {
    beforeValidate: [
        ({ data, req }) => {
          // Ensure `data` is always an object
          data = data || {};
      
          if (req.user?.role === 'accountmanager') {
            if (!req.user.instituteId) {
              throw new Error('Account managers must have an associated institute.');
            }
            data.instituteId = req.user.instituteId?.id || req.user.instituteId;
          }
      
          return data;
        },
      ],
  },
  fields: [
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Plan Icon',
      required: false,
    },
    { name: 'plan_title', type: 'text', required: true, label: 'Plan Title' },
    {
      name: 'usp',
      type: 'array',
      label: 'Unique Selling Points (USPs)',
      fields: [{ name: 'usp_item', type: 'text', required: true, label: 'USP Item' }],
    },
    { name: 'price_usd', type: 'text', label: 'Price (USD)', required: false },
    { name: 'price_ind', type: 'text', label: 'Price (INR)', required: false },
    { name: 'sale_price_usd', type: 'text', label: 'Sale Price (USD)', required: false },
    { name: 'sale_price_ind', type: 'text', label: 'Sale Price (INR)', required: false },

    // ✅ **New Field: isBestSeller**
    { 
      name: 'isBestSeller', 
      type: 'checkbox', 
      label: 'Best Seller?', 
      defaultValue: false 
    },
  ],
};