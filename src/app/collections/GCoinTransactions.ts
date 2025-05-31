import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';

const isAdmin = (req) => req.user && 'role' in req.user && req.user.role === 'admin';

export const GCoinTransactions: CollectionConfig = {
  slug: 'gcointransactions',
  auth: {
    useAPIKey: true, // ✅ Allow API key-based access
  },
  access: {
    read: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
    create: ({ req }) => isAdmin(req), // Only admin can create manually
    update: ({ req }) => isAdmin(req), // Only admin can update manually
    delete: ({ req }) => isAdmin(req), // Only admin can delete
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
        { label: 'Purchase', value: 'purchase' },
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
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date(),
      admin: { position: 'sidebar' },
    },
    // Optional Razorpay payment fields (only filled for purchases)
    {
      name: 'razorpayPaymentId',
      type: 'text',
      required: false,
    },
    {
      name: 'razorpayOrderId',
      type: 'text',
      required: false,
    },
    {
      name: 'razorpaySignature',
      type: 'text',
      required: false,
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
          }
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
          }
        );
      },
    },
  ],
};