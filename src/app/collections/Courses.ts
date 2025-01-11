import { CollectionConfig } from 'payload/types';

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

const mediaField = {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  label: 'Image',
};

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    // Restrict reading to admins and account managers based on institute
    read: ({ req: { user } }) => {
      if (!user) return false;

      const { role, instituteId } = user;

      if (role === 'admin') return true;

      if (role === 'accountmanager' && instituteId?.id) {
        return {
          instituteId: {
            equals: instituteId.id,
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
    update: ({ req: { user }, doc }) => {
      if (!user) return false;

      if (user.role === 'admin') return true;

      if (user.role === 'accountmanager') {
        return doc?.createdBy?.toString() === user?.id;
      }

      return false;
    },
    // No one can delete courses
    delete: () => false,
  },
  admin: { useAsTitle: 'title' },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (!data.instituteId && req.user?.role === 'accountmanager') {
          // Automatically set the instituteId for account managers
          data.instituteId = req.user.instituteId?.id;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'summary', type: 'textarea', required: true },
    mediaField,
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
      relationTo: 'institute', // Ensure "institute" is a valid collection slug
      required: true,
      admin: {
        readOnly: true, // Prevent manual editing
        position: 'sidebar',
      },
    },
    ...seoFields,
    ...statusFields,
  ],
};