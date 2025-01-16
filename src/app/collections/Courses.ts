import type { CollectionConfig } from 'payload';

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    // Read Access
    read: ({ req: { user } }: any) => {
      if (!user) return false;

      const { role, instituteId } = user;

      // Admins can read all courses
      if (role === 'admin') return true;

      // Account managers can only read courses related to their institute
      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue = typeof instituteId === 'string' ? instituteId : instituteId.id;

        if (instituteIdValue) {
          return {
            instituteId: {
              equals: instituteIdValue,
            },
          };
        }
      }

      return false; // Deny access to everyone else
    },

    // Create Access
    create: ({ req: { user } }: any) => {
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },

    // Update Access
    update: ({ req: { user }, doc }: any) => {
      if (!user) return false;

      const { role, instituteId } = user;

      // Admins can update everything
      if (role === 'admin') return true;

      // Account managers can only update courses related to their institute
      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue = typeof instituteId === 'string' ? instituteId : instituteId.id;
        return doc.instituteId?.toString() === instituteIdValue;
      }

      return false; // Deny access to everyone else
    },

    // Delete Access (No one can delete)
    delete: () => false,
  },

  admin: { useAsTitle: 'title' },

  hooks: {
    // Before Validate Hook
    beforeValidate: [
      ({ data, req }) => {
        console.log('Courses: Before Validate - Incoming Data:', data);
        console.log('Logged-In User:', req.user);

        // Ensure data object exists
        data ??= {};

        // Automatically set `instituteId` for account managers
        if (req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }

          data.instituteId =
            typeof req.user.instituteId === 'string'
              ? req.user.instituteId
              : req.user.instituteId?.id;
        }

        return data;
      },
    ],

    // Before Change Hook
    beforeChange: [
      ({ data, req }) => {
        console.log('Courses: Before Change - Modified Data:', data);

        // Ensure data object exists
        data ??= {};

        // Ensure `instituteId` is correctly set for account managers
        if (req.user?.role === 'accountmanager') {
          data.instituteId =
            typeof req.user.instituteId === 'string'
              ? req.user.instituteId
              : req.user.instituteId?.id || data.instituteId;
        }

        return data;
      },
    ],
  },

  fields: [
    // Course Title
    { name: 'title', type: 'text', required: true },

    // Summary (Rich Text)
    {
      name: 'summary',
      type: 'richText',
      required: true,
      label: 'Summary (Rich Text)',
    },

    // Image Upload
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
    },

    // Course Category Relationship
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'coursecategories',
      required: true,
    },

    // Slug
    { name: 'slug', type: 'text', unique: true },

    // Featured and Popular Checkboxes
    { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    { name: 'isPopular', type: 'checkbox', defaultValue: false },

    // Institute Relationship
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: {
        readOnly: ({ user }) => user.role !== 'admin', // Only editable by admin
        position: 'sidebar',
        condition: (_, { user }) => !!user?.instituteId || user.role === 'admin', // Show only if user has instituteId
      },
    },

    // Course Content
    {
      name: 'course_content',
      type: 'array',
      label: 'Course Content',
      fields: [
        {
          name: 'topic',
          type: 'text',
          required: true,
          label: 'Topic',
        },
        {
          name: 'subtopics',
          type: 'array',
          label: 'Subtopics',
          fields: [
            {
              name: 'subtopic',
              type: 'text',
              required: true,
              label: 'Subtopic',
            },
          ],
        },
      ],
    },

    // Course Content PDF
    {
      name: 'course_content_pdf',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Course Content PDF',
    },

    // Unique Selling Points (USPs)
    {
      name: 'usp',
      type: 'array',
      label: 'Unique Selling Points (USPs)',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: 'USP Main Text',
        },
        {
          name: 'subText',
          type: 'text',
          required: false,
          label: 'USP Sub Text',
        },
      ],
    },

    // Learnings
    {
      name: 'learnings',
      type: 'array',
      label: 'What You Will Learn',
      fields: [
        {
          name: 'learning_item',
          type: 'text',
          required: true,
          label: 'Learning Item (One Liner)',
        },
      ],
    },

    // Skills Gained
    {
      name: 'skills',
      type: 'array',
      label: 'Skills Gained',
      fields: [
        {
          name: 'skill_item',
          type: 'text',
          required: true,
          label: 'Skill Item (One Liner)',
        },
      ],
    },

    // Active Checkbox
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },

    // Upcoming Checkbox
    {
      name: 'upcoming',
      type: 'checkbox',
      label: 'Upcoming',
      defaultValue: false,
    },

    // SEO Fields
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

    // Completion Time
    {
      name: 'completion_time',
      type: 'text',
      required: false,
      label: 'Course Completion Time',
    },

    // Pricing
    {
      name: 'price_ind',
      type: 'text',
      required: false,
      label: 'Price India',
    },
    {
      name: 'price_usd',
      type: 'text',
      required: false,
      label: 'Price USD',
    },

    // External Links
    {
      name: 'youtube_url',
      type: 'text',
      required: false,
      label: 'Youtube URL',
    },
    {
      name: 'bot_url',
      type: 'text',
      required: false,
      label: 'Bot URL',
    },

    // Priority Sequence
    {
      name: 'prioritysequence',
      type: 'text',
      required: false,
      label: 'Priority Sequence',
    },
  ],
};