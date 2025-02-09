import type { CollectionConfig } from 'payload';

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue = typeof instituteId === 'string' ? instituteId : instituteId.id;
        if (instituteIdValue) {
          return { instituteId: { equals: instituteIdValue } };
        }
      }
      return false;
    },
    create: ({ req: { user } }: any) => user?.role === 'admin' || user?.role === 'accountmanager',
    update: ({ req: { user } }: any) => user?.role === 'admin' || user?.role === 'accountmanager',
    delete: () => false,
  },
  admin: {
    useAsTitle: 'title',
    hidden: ({ user }) => {
      const { role } = user || {};
      return !(role === 'admin' || role === 'accountmanager');
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        console.log('Courses: Before Validate - Incoming Data:', data);
        console.log('Logged-In User:', req.user);
        data ??= {};
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
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'summary',
      type: 'richText',
      required: true,
      label: 'Summary (Rich Text)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'coursecategories',
      required: true,
    },
    { name: 'slug', type: 'text', unique: true },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    { name: 'isPopular', type: 'checkbox', defaultValue: false },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'course_content',
      type: 'array',
      label: 'Course Content',
      fields: [
        { name: 'topic', type: 'text', required: true, label: 'Topic' },
        { name: 'subtopic', type: 'richText', required: true, label: 'Subtopic' },
      ],
    },
    {
      name: 'who_is_this_for',
      type: 'array',
      label: 'Who is this course for?',
      required: false, // ✅ Not required
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Target Audience' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media', // ✅ Linking to media collection
          label: 'Icon/Image',
          required: false, // ✅ Image is optional
        },
      ],
    },
    {
      name: 'usp',
      type: 'array',
      label: 'Unique Selling Points (USPs)',
      fields: [
        { name: 'text', type: 'text', required: true, label: 'USP Main Text' },
        { name: 'subText', type: 'text', required: false, label: 'USP Sub Text' },
      ],
    },
    {
      name: 'learnings',
      type: 'array',
      label: 'What You Will Learn',
      fields: [{ name: 'learning_item', type: 'text', required: true, label: 'Learning Item' }],
    },
    {
      name: 'skills',
      type: 'array',
      label: 'Skills Gained',
      fields: [{ name: 'skill_item', type: 'text', required: true, label: 'Skill Item' }],
    },
    { name: 'active', type: 'checkbox', label: 'Active', defaultValue: true },
    { name: 'upcoming', type: 'checkbox', label: 'Upcoming', defaultValue: false },
    {
      name: 'token',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
    },
    { name: 'seotitle', type: 'text', label: 'SEO Title' },
    { name: 'seodescription', type: 'textarea', label: 'SEO Description' },
    { name: 'completion_time', type: 'text', label: 'Course Completion Time', required: false },
    { name: 'price_ind', type: 'text', label: 'BasePrice India', required: false },
    { name: 'sales_price_ind', type: 'text', label: 'Sales Price India', required: false },
    { name: 'price_usd', type: 'text', label: 'Base Price USD', required: false },
    { name: 'sales_price_usd', type: 'text', label: 'Sales Price USD', required: false },
    { name: 'youtube_url', type: 'text', label: 'Youtube URL', required: false },
    { name: 'bot_url', type: 'text', label: 'Bot URL', required: false },
    { name: 'prioritysequence', type: 'text', label: 'Priority Sequence', required: false },
  ],
};