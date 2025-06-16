import type { CollectionConfig } from 'payload';

export const GCoinTransactions: CollectionConfig = {
  slug: 'gcointransactions',

  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, id } = req.user;
      if (role === 'admin' || role === 'accountmanager') return true;
      return { userId: { equals: id } };
    },
    create: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      return (
  (req.user?.collection === 'users' &&
    (req.user.role === 'admin' || req.user.role === 'accountmanager')) ||
  isApiKey
);
    },
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      return (
  (req.user?.collection === 'users' &&
    (req.user.role === 'admin' || req.user.role === 'accountmanager')) ||
  isApiKey
);
    },
    delete: ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'admin',
  },

  admin: { useAsTitle: 'id' },

  fields: [
    { name: 'userId', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },
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
    { name: 'balanceAfter', type: 'number' }, // will be set later on success
    { name: 'source', type: 'text', required: true },
    { name: 'description', type: 'text' },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'INR', value: 'INR' },
        { label: 'USD', value: 'USD' },
      ],
      defaultValue: 'INR',
      required: true,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    { name: 'razorpayOrderId', type: 'text' },
    { name: 'razorpayPaymentId', type: 'text' },
    { name: 'razorpaySignature', type: 'text' },
    {
      name: 'timestamp',
      type: 'date',
      admin: { position: 'sidebar' },
      defaultValue: () => new Date(),
    },
  ],

  endpoints: [
    {
      path: '/add-transaction',
      method: 'post',
      handler: async (req: any) => {
        try {
          const body = await req.json();

          const {
            userId,
            amount,
            type,
            source,
            description,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            currency = 'INR',
            paymentStatus = 'pending',
          } = body;

          console.log('✅ Incoming /add-transaction payload:', body);

          if (!userId || typeof amount !== 'number' || !type || !source) {
            console.error('❌ Missing required fields:', body);
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
          }

          const userRecord = await req.payload.findByID({
            collection: 'users',
            id: userId,
          });

          if (!userRecord) {
            console.error('❌ User not found:', userId);
            return Response.json({ error: 'User not found' }, { status: 404 });
          }

          console.log('🔍 User record found:', {
            id: userRecord.id,
            email: userRecord.email,
            gCoins: userRecord.gCoins,
          });

          // ✅ Only record the transaction now; no balance updates here
          const transactionData = {
            userId,
            amount,
            type,
            source,
            description,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            currency,
            paymentStatus,
            timestamp: new Date(),
          };

          console.log('🟡 About to create transaction with:', transactionData);

          const transaction = await req.payload.create({
            collection: 'gcointransactions',
            data: transactionData,
          });

          console.log('✅ Transaction saved, ID:', transaction.id);

          return Response.json(
            {
              message: 'Transaction successfully added',
              result: { id: transaction.id },
            },
            { status: 200 }
          );
        } catch (error: unknown) {
          console.error('❌ Error in /add-transaction:', error);
          const errorMessage =
            error instanceof Error ? error.message : JSON.stringify(error);
          return Response.json(
            { error: 'Internal server error', details: errorMessage },
            { status: 500 }
          );
        }
      },
    },
  ],
};

export default GCoinTransactions;