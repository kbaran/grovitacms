import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true, // Enable API key-based access
  },
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
  fields: [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: false,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      defaultValue: 'siteusers',
      options: [
        { label: 'Site Admin', value: 'admin' },
        { label: 'Site User', value: 'siteusers' },
        { label: 'Account Manager', value: 'accountmanager' },
      ],
      admin: {
        description: 'Specify the role of the user.',
      },
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute', // Ensure "institute" is a valid collection slug
      admin: {
        position: 'sidebar', // Ensures it always shows in the sidebar
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: {
        description: 'Upload a profile picture (JPEG, PNG only).',
      },
    },
    {
      name: 'linkedin_link',
      type: 'text',
      admin: {
        placeholder: 'https://linkedin.com/in/your-profile',
      },
      validate: (value) =>
        !value || /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+$/.test(value)
          ? true
          : 'Please enter a valid LinkedIn URL.',
    },
    {
      name: 'twitter_link',
      type: 'text',
      admin: {
        placeholder: 'https://twitter.com/your-profile',
      },
      validate: (value) =>
        !value || /^https:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/.test(value)
          ? true
          : 'Please enter a valid Twitter URL.',
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },
    {
      name: 'userType',
      label: 'User Type',
      type: 'select',
      required: true,
      defaultValue: 'student',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Parent', value: 'parent' },
        { label: 'Institute', value: 'institute' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Type of user for role-specific features and access.',
      },
    },    
    {
      name: 'is_phone_verified',
      type: 'checkbox',
      label: 'Phone Verified',
      defaultValue: false,
    },  
    {
      name: 'phone_number',
      type: 'text',
      label: 'Phone Number',
      required: true,
    },         
    {
      name: 'xp',
      type: 'number',
      label: 'XP',
      defaultValue: 0,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Total experience points earned by the user.',
      },
    },
    {
      name: 'xpSpent',
      type: 'number',
      label: 'XP Spent',
      defaultValue: 0,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'XP used on boosters, AI tutor, etc.',
      },
    },
    {
      name: 'xpEarnedThisWeek',
      type: 'number',
      label: 'XP This Week',
      defaultValue: 0,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Used for weekly goal tracking.',
      },
    },
    {
      name: 'lastXPUpdateAt',
      type: 'date',
      label: 'Last XP Update',
      admin: {
        position: 'sidebar',
        description: 'Timestamp of the last XP change.',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'level',
      type: 'number',
      label: 'Current XP Level',
      defaultValue: 1,
      admin: {
        position: 'sidebar',
        description: 'Precomputed XP level (optional).',
      },
    },    
    {
      name: 'grade',
      type: 'text',
      label: 'Grade/Class',
      required: false,
      admin: {
        position: 'sidebar',
        placeholder: 'e.g. 11th, 12th, etc.',
      },
    },
    {
      name: 'school',
      type: 'text',
      label: 'School Name',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true
    },
    {
      name: 'referredBy',
      type: 'text'
    },
    {
      name: 'referralCount',
      type: 'number',
      defaultValue: 0
    },
    {
      name: 'referralRewards',
      type: 'number',
      defaultValue: 0
    },
    {
      name: 'targetExamYear',
      type: 'text',
      label: 'Target Exam Year',
      required: false,
      admin: {
        position: 'sidebar',
        placeholder: 'e.g. 2026',
      },
    },
    {
      name: 'parentName',
      type: 'text',
      label: 'Parent Name',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'parentPhone',
      type: 'text',
      label: 'Parent Phone Number',
      required: false,
      admin: {
        position: 'sidebar',
        placeholder: '10-digit phone number',
      },
    },
    {
      name: 'plan',
      type: 'select',
      label: 'Subscription Plan',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Premium', value: 'premium' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Tracks the user’s current subscription plan.',
      },
    },    
    {
      name: 'aiTutorHitsToday',
      type: 'number',
      label: 'AI Tutor Hits Today',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Number of AI Tutor hits used today.',
      },
    },
    {
      name: 'examAssistHitsThisMonth',
      type: 'number',
      label: 'Exam Assist Hits This Month',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Number of Exam Assistance hits used this month.',
      },
    },
    {
      name: 'mockTestsThisYear',
      type: 'number',
      label: 'Mock Tests Taken This Year',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Number of mock tests taken this year.',
      },
    },
    {
      name: 'lastAiTutorResetDate',
      type: 'date',
      label: 'Last AI Tutor Reset Date',
      admin: {
        position: 'sidebar',
        description: 'Tracks when the daily AI Tutor counter was last reset.',
      },
    },
    {
      name: 'lastExamAssistResetDate',
      type: 'date',
      label: 'Last Exam Assist Reset Date',
      admin: {
        position: 'sidebar',
        description: 'Tracks when the monthly Exam Assist counter was last reset.',
      },
    },
    {
      name: 'lastMockTestResetDate',
      type: 'date',
      label: 'Last Mock Test Reset Date',
      admin: {
        position: 'sidebar',
        description: 'Tracks when the yearly Mock Test counter was last reset.',
      },
    },
    
  ],
  endpoints: [
    {
      path: '/:add-request',
      method: 'post',
      handler: async (req: any) => {
        const data = await req?.json();
        await addDataAndFileToRequest(req);
        const result = await req.payload.create({ collection: 'users', data });

        return Response.json(
          { message: `Data successfully added!`, result: result },
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
      path: '/update-xp-status',
      method: 'post',
      handler: async (req: any) => {
        try {
          const body = await req.json();
          const { userId } = body;
    
          if (!userId) {
            return Response.json(
              { error: 'Missing userId' },
              { status: 400 }
            );
          }
    
          const { decayXPAndResetGoals } = await import('../utils/xp/decayXPAndResetGoals');
          await decayXPAndResetGoals(userId, req);
    
          return Response.json(
            { message: 'XP updated successfully' },
            { status: 200 }
          );
        } catch (err) {
          console.error('XP update failed:', err);
          return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }
      },
    }
  ],
};