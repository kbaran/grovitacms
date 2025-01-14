import type { CollectionConfig } from 'payload'

const statusFields = [
  {
    name: 'active',
    type: 'checkbox',
    label: 'Active',
    defaultValue: true,
  },
  {
    name: 'token',
    type: 'text',
    unique: true,
    admin: {
      readOnly: true,
    },
  },
];

const seoFields = [
  {
    name: 'seotitle',
    type: 'text',
    label: 'SEO Title',
  },
  {
    name: 'seodescription',
    type: 'textarea',
    label: 'SEO Description',
  },
];

export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  access: {
    // Restrict reading to admins and account managers based on institute
    read: ({ req: { user } }) => {
      if (!user) return false;
      const { role, instituteId } = user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId,
          },
        };
      }
      return false;
    },
    // Allow only admins and account managers to create
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },
    // Allow updates only by the creator or admin
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // if (user.role === 'accountmanager') {
      //   return doc?.createdBy?.toString() === user?.id;
      // }
      return false;
    },
    // No one can delete course modules
    delete: () => false,
  },
  admin: { useAsTitle: 'module' },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (!data.instituteId && req.user?.role === 'accountmanager') {
          // Automatically set the instituteId for account managers
          data.instituteId = req.user.instituteId;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'module',
      type: 'text',
      required: true,
    },
    {
      name: 'topics',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content',
        },
        {
          name: 'video',
          type: 'text',
          label: 'Video URL',
          admin: {
            placeholder: 'https://example.com/video',
          },
        },
        {
          name: 'subtopics',
          type: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Subtopic Content',
            },
            {
              name: 'video',
              type: 'text',
              label: 'Subtopic Video URL',
              admin: {
                placeholder: 'https://example.com/video',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute', // Ensure "institute" is a valid collection slug
      required: true,
      admin: {
        readOnly: true, // Prevent manual editing
        position: 'sidebar',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },
    {
      name: 'token',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'seotitle',
      type: 'text',
      label: 'SEO Title',
    },
    {
      name: 'seodescription',
      type: 'textarea',
      label: 'SEO Description',
    },
  ],
};