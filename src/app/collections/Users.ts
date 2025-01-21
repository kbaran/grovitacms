import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true, // Enable API key-based access
  },
  access: {
    // Allow read access through the API
    read: ({ req: { user } }) => {
      // If the user is authenticated, allow access
      return Boolean(user);
    },
    // Allow create access through the API
    create: ({ req: { user } }) => {
      // Allow creation by anyone (public access), or restrict it
      // to authenticated users by adding a condition, e.g.:
      return Boolean(user); // Allow only if authenticated
    },
    // Allow update access through the API
    update: ({ req: { user } }) => {
      // Allow updates only by authenticated users
      return Boolean(user);
    },
    // Allow delete access through the API
    delete: () => false, // Disable deletion of users through the API
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
  ],
};