import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  access: {
    // Ensure account managers only see categories of their institute
    read: ({ req: { user } }) => {
      if (!user) return false; // Deny access if no user is logged in

      const { role, instituteId } = user;

      // Admins can read all categories
      if (role?.includes('admin')) {
        return true;
      }

      // Account managers can only read categories from their institute
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId, // Ensure the instituteId matches
          },
        };
      }

      // Deny access for all other roles
      return false;
    },
    create: isAdminOrManager, // Apply access control for creation
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user?.role === 'accountmanager') {
          // Automatically assign the instituteId
          data.instituteId = req.user.instituteId;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text', // Properly defined type
      required: true,
      label: 'Category Title',
    },
    {
      name: 'slug',
      type: 'text', // Properly defined type
      required: true,
      label: 'Category Slug',
    },
    {
      name: 'content',
      type: 'richText', // Properly defined type
      required: false,
      label: 'Category Content',
    },
    {
      name: 'brandlogo',
      type: 'upload', // Properly defined type
      relationTo: 'media', // Ensure "media" is a valid collection slug
      required: false,
      label: 'Brand Logo',
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      admin: {
        readOnly: true, // Prevent manual editing
        position: 'sidebar',
        condition: (_, { user }) => {
          // Only show the field if the user has an instituteId
          return !!user?.instituteId
        },
      },
      hooks: {
        beforeValidate: [
          ({ data, user }:any) => {
            if (user?.instituteId) {
              // Auto-fill the field with the logged-in user's instituteId
              data.instituteId = user.instituteId
            }
            return data
          },
        ],
      },
      // Apply a static filter for dropdown options
      // admin: {
      //   components: {
      //     Field: ({ user, field }) => ({
      //       ...field,
      //       where: {
      //         id: {
      //           equals: user?.instituteId || null, // Show only the user's instituteId
      //         },
      //       },
      //     }),
      //   },
      // },
    },
  ],
};