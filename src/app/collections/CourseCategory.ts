import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;

      const { role, instituteId } = user;

      if (role === 'admin') {
        return true;
      }

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

      return false;
    },
    create: isAdminOrManager,
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        console.log('Before Validate - Incoming Data:', data);
        console.log('Logged-In User:', req.user);

        // Ensure data exists
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
    beforeChange: [
      ({ data, req }) => {
        console.log('Before Change - Modified Data:', data);

        // Ensure data exists
        data ??= {};

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
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Category Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      label: 'Category Slug',
    },
    {
      name: 'content',
      type: 'richText',
      required: false,
      label: 'Category Content',
    },
    {
      name: 'brandlogo',
      type: 'upload',
      relationTo: 'media',
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
        position: 'sidebar',
        condition: (_, { user }) => {
          return !!user?.instituteId || user?.role === 'admin';
        },
      },
      hooks: {
        beforeValidate: [
          ({ data, req }) => {
            data ??= {}; // Ensure data exists

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
    },
  ],
};