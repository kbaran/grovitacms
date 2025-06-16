import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig, CollectionAfterChangeHook } from 'payload';
import payload from 'payload';

// XP calculation logic
const calculateXP = ({
  isCorrect,
  isReattempt,
  difficulty,
  timeSpent,
}: {
  isCorrect: boolean;
  isReattempt?: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'very-hard';
  timeSpent?: number;
}): number => {
  if (!isCorrect) return 0;
  let baseXP = { easy: 5, medium: 7, hard: 10, 'very-hard': 12 }[difficulty] || 0;
  if (isReattempt) baseXP *= 1.5;
  if (timeSpent && timeSpent <= 60) baseXP += 2;
  return Math.round(baseXP);
};

const calculateLevel = (xp: number): number => {
  return Math.max(1, Math.floor(xp / 500) + 1); // Example: Level 1 at 0–499 XP, Level 2 at 500+, etc.
};

// XP award logic
const awardXP = async ({
  userId,
  xp,
  req,
}: {
  userId: string;
  xp: number;
  req: any;
}) => {
  const result = await req.payload.find({
    collection: 'users',
    where: { id: { equals: userId } },
  });

  const user = result?.docs?.[0];
  if (!user) return;

  const updatedXP = Number(user.xp || 0) + xp;
  const updatedWeeklyXP = Number(user.xpEarnedThisWeek || 0) + xp;
  const newLevel = calculateLevel(updatedXP);

  await req.payload.update({
    collection: 'users',
    id: user.id,
    data: {
      xp: updatedXP,
      xpEarnedThisWeek: updatedWeeklyXP,
      lastXPUpdateAt: new Date().toISOString(),
      level: newLevel, // ✅ update level based on new XP
    },
  });
};
// XP hook
const xpAfterChangeHook: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return;

  const { userId, isCorrect, isReattempt, difficulty, timeSpent } = doc as {
    userId: string;
    isCorrect: boolean;
    isReattempt?: boolean;
    difficulty: 'easy' | 'medium' | 'hard' | 'very-hard';
    timeSpent?: number;
  };

  if (!userId || !isCorrect) return;

  const xp = calculateXP({ isCorrect, isReattempt, difficulty, timeSpent });
  if (xp > 0) await awardXP({ userId, xp, req });
};

export const UserResponses: CollectionConfig = {
  slug: 'userresponses',
  access: {
    read: ({ req }: any) => {
      console.log(req.user);
      if (!req.user) return false;
      if (req.user.role === 'admin' || req.user.role === 'accountmanager') {
        return true;
      }
      return { userId: { equals: req.user.id } };
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => false,
    delete: ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'admin',
  },
  admin: {
    useAsTitle: 'questionId',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};
        return data;
      },
    ],
    afterChange: [xpAfterChangeHook],
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      label: 'User ID',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'questionId',
      type: 'relationship',
      relationTo: 'mocktestquestions',
      required: true,
      label: 'Mock Test Question',
    },
    {
      name: 'categoryId',
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Subject',
    },
    {
      name: 'syllabus',
      type: 'text',
      required: true,
      label: 'Syllabus',
    },
    {
      name: 'topics',
      type: 'text',
      required: false,
      label: 'Topics Covered (Comma-Separated)',
    },
    {
      name: 'difficulty',
      type: 'select',
      required: true,
      label: 'Difficulty',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' },
        { label: 'Very Hard', value: 'very-hard' },
      ],
    },
    {
      name: 'timeSpent',
      type: 'number',
      required: true,
      label: 'Time Spent (Seconds)',
      defaultValue: 0,
    },
    {
      name: 'isCorrect',
      type: 'checkbox',
      required: false,
      label: 'Correct Answer',
    },
    {
      name: 'isSkipped',
      type: 'checkbox',
      required: true,
      label: 'Skip Question',
      defaultValue: false,
    },
    {
      name: 'skipCount',
      type: 'number',
      required: true,
      label: 'Times Skipped',
      defaultValue: 0,
    },
    {
      name: 'isReattempt',
      type: 'checkbox',
      label: 'Is Reattempt',
      required: false,
      defaultValue: false,
      admin: {
        description: 'Marked true if user has attempted this question before.',
      },
    },
  ],
  endpoints: [
    {
      path: '/:add-response',
      method: 'post',
      handler: async (req: any) => {
        try {
          const data = await req?.json();
          if (!data.userId) {
            if (req.user?.id) {
              data.userId = req.user.id;
            } else {
              return new Response(
                JSON.stringify({ error: 'User ID is required but not provided' }),
                {
                  status: 400,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                  },
                },
              );
            }
          }

          const response = await req.payload.create({
            collection: 'userresponses',
            data,
          });

          return new Response(
            JSON.stringify({
              message: `Data successfully added!`,
              result: data,
              responseId: response.id,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              },
            },
          );
        } catch (error) {
          console.error('Error saving response:', error);
          return new Response(
            JSON.stringify({ error: error || 'Failed to save response' }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            },
          );
        }
      },
    },
  ],
};

export default UserResponses;
