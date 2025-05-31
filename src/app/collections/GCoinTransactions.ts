import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';

export const GCoinTransactions: CollectionConfig = {
  slug: 'gcointransactions',
  auth: {
    useAPIKey: true,
  },
  access: {
    read: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
    create: ({ req }) => req?.user?.role === 'admin',
    update: ({ req }) => req?.user?.role === 'admin',
    delete: () => false,
  },
  admin: {
    useAsTitle: 'description',
  },
  fields: [
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Earn', value: 'earn' },
        { label: 'Spend', value: 'spend' },
        { label: 'Purchase', value: 'purchase' }, // ✅ NEW type for purchased coins
      ],
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      admin: {
        description: 'E.g., referral, mocktest, ai-tutor, manual, razorpay',
      },
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'razorpayPaymentId',
      type: 'text',
      required: false,
      admin: {
        description: 'Razorpay payment_id (only for purchases)',
      },
    },
    {
      name: 'razorpayOrderId',
      type: 'text',
      required: false,
      admin: {
        description: 'Razorpay order_id (only for purchases)',
      },
    },
    {
      name: 'razorpaySignature',
      type: 'text',
      required: false,
      admin: {
        description: 'Razorpay signature (only for purchases)',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date(),
      admin: { position: 'sidebar' },
    },
  ],
  endpoints: [
    {
      path: '/:add-transaction',
      method: 'post',
      handler: async (req: any) => {
        const data = await req?.json();
        await addDataAndFileToRequest(req);
        const result = await req.payload.create({ collection: 'gcointransactions', data });

        return Response.json(
          { message: `Transaction successfully added!`, result },
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
    {
      path: '/user-history/:userId',
      method: 'get',
      handler: async (req: any) => {
        const userId = req.params.userId;

        if (!userId) {
          return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const transactions = await req.payload.find({
          collection: 'gcointransactions',
          where: { userId: { equals: userId } },
          sort: '-timestamp',
          limit: 50,
        });

        return Response.json(
          { message: `Fetched transaction history`, result: transactions.docs },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          },
        );
      },
    },
  ],
};