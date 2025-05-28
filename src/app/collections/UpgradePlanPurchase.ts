import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';

export const UpgradePlanPurchases: CollectionConfig = {
  slug: 'upgradeplanpurchases',
  access: {
    read: () => true, // ✅ Anyone can read purchases (optional — adjust if needed)
    create: () => true, // ✅ Allow creation even without login (API-Key or public)
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
    delete: () => false, // ✅ No one can delete
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'dateOfPurchase', type: 'date', required: true },
    { name: 'marketPrice', type: 'number', required: true },
    { name: 'discountCode', type: 'text' },
    { name: 'discountPercentage', type: 'number' },
    { name: 'salePrice', type: 'number', required: true },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'examCategory',
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
    },
    { name: 'planExpiresOn', type: 'date' },
    { name: 'razorpayPaymentId', type: 'text' },
    { name: 'razorpayOrderId', type: 'text' },
  ],
  endpoints: [
    {
      path: '/:add-request',
      method: 'post',
      handler: async (req: any) => {
        const data = await req?.json();
        
        const result = await req.payload.create({ collection: 'upgradeplanpurchases', data });

        return Response.json(
          { message: `Purchase successfully added!`, result },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          },
        );
      },
    },
  ],
};