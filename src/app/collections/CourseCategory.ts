import { isAdminOrManager } from '@/access/isAdminOrManager'
import type { CollectionConfig } from 'payload'

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  access: {
    read: isAdminOrManager, // Apply access control
    create: isAdminOrManager, // Apply access control
  },
  admin: {
    useAsTitle: 'title',
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
        position: 'sidebar',
        condition: (_, { user }) => {
          // Only show the field if the user has an instituteId
          return !!user?.instituteId
        },
      },
      hooks: {
        beforeValidate: [
          ({ data, user }) => {
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
}
