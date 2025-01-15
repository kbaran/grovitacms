import type { CollectionConfig } from 'payload';

export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    // Restrict reading based on role
    read: ({ req: { user } }: any) => {
      if (!user) return false;

      const { role, instituteId } = user;

      if (role === 'admin') return true;

      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId.id,
          },
        };
      }

      return false;
    },
    // Allow only admins and account managers to create
    create: ({ req: { user } }: any) => {
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },
    // Allow updates only by creator or admin
    update: ({ req: { user }, doc }: any) => {
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
    beforeValidate: [
      ({ data, req }) => {
        console.log('Courses: Before Validate - Incoming Data:', data);
        console.log('Logged-In User:', req.user);

        // Auto-assign `instituteId` for account managers
        if (req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId = req.user.instituteId.id || data.instituteId; // Assign proper ID
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        console.log('Courses: Before Change - Modified Data:', data);

        // Ensure `instituteId` is set for account managers
        if (req.user?.role === 'accountmanager') {
          data.instituteId = req.user.instituteId?.id || data.instituteId;
        }

        return data;
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'summary', type: 'textarea', required: true },
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
      relationTo: 'institute', // Ensure this is a valid collection slug
      required: true,
      admin: {
        readOnly: true, // Prevent manual editing
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, req }) => {
            if (req.user?.role === 'accountmanager') {
              data.instituteId = req.user.instituteId?.id || data.instituteId; // Auto-assign `instituteId`
            }
            return data;
          },
        ],
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