import type { CollectionConfig } from 'payload';

export const GCoinTransactions: CollectionConfig = {
  slug: 'gcointransactions',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false;
      const { role, id } = req.user;
      if (role === 'admin' || role === 'accountmanager') return true;
      return { userId: { equals: id } };
    },
    create: ({ req }) => {
      // ✅ Allow ONLY:
      // - requests made by authenticated users (req.user exists), OR
      // - internal API requests with API keys
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
  
    update: ({ req }) => {
      // ✅ Allow only admin panel edits (which run as admin), or your server-side API calls
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isAdminSession = req.user?.collection === 'users' && req.user?.role === 'admin';
      return isAdminSession || isApiKey;
    },
  
    delete: ({ req }) => {
      // ✅ Only admin panel or API key can delete
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isAdminSession = req.user?.collection === 'users' && req.user?.role === 'admin';
      return isAdminSession || isApiKey;
    },
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
      admin: { description: 'E.g., referral, mocktest, ai-tutor, manual' },
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'razorpayPaymentId',
      type: 'text',
      required: false,
      admin: { description: 'Razorpay Payment ID for purchase transactions' },
    },
    {
      name: 'razorpayOrderId',
      type: 'text',
      required: false,
      admin: { description: 'Razorpay Order ID for purchase transactions' },
    },
    {
      name: 'razorpaySignature',
      type: 'text',
      required: false,
      admin: { description: 'Razorpay Signature for verification' },
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
        const result = await req.payload.create({
          collection: 'gcointransactions',
          data,
        });

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

export default GCoinTransactions;