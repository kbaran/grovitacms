import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true, // Enable API key-based access
  },
  access: {
    read: () => true, // ✅ Anyone can read users
    create: () => true, // ✅ Allow user creation without login (important!)
    update: ({ req }) => !!req.user, // ✅ Allow only logged-in users to update
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
      required: true,
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
  ],
  endpoints: [
    {
      path: '/:add-request',
      method: 'post',
      handler: async (req: any) => {
        const data = await req?.json()
        await addDataAndFileToRequest(req)
        console.log('🚀 Brij 90 ~  file: ApprovalRequest.ts:30 ~  handler: ~  data:', data)
        const result = await req.payload.create({ collection: 'users', data })
        
        return Response.json(
          { message: `Data successfully added!`, result: result },
          {
            headers: {
              'Access-Control-Allow-Origin': '*', // Adjust the origin as needed
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          },
        )
      },
    },
  ],
};