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
      if (role === 'admin') {
        return true;
      }

      // Account managers can only read categories from their institute
      if (role === 'accountmanager' && instituteId?.id) {
        return {
          instituteId: {
            equals: instituteId.id, // Ensure the instituteId matches
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
          data.instituteId = req.user.instituteId?.id;
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
      relationTo: 'institute', // Ensure "institute" is a valid collection slug
      required: true,
      label: 'Institute',
      admin: {
        readOnly: true, // Prevent manual editing
        position: 'sidebar',
      },
    },
  ],
};