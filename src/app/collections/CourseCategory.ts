import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  access: {
    read: isAdminOrManager, // Apply access control
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text', // Ensure type is properly defined
      required: true,
      label: 'Category Title',
    },
    {
        name: 'slug',
        type: 'text', // Ensure type is properly defined
        required: true,
        label: 'Category Slug',
    },
    {
      name: 'content',
      type: 'richText', // Ensure type is valid
      required: false,
      label: 'Category Content',
    },
    {
      name: 'brandlogo',
      type: 'upload', // Ensure type is valid
      relationTo: 'media', // Ensure "media" is a valid collection slug
      required: false,
      label: 'Brand Logo',
    },
    {
      name: 'instituteId',
      type: 'relationship', // Ensure type is properly defined
      relationTo: 'institute', // Ensure "institute" is a valid collection slug
      required: true, // This field must be set for every category
      label: 'Institute',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};