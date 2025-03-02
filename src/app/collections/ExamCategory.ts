import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const ExamCategory: CollectionConfig = {
  slug: 'examcategories',
  access: {
    // Public API access for all users, including logged-out ones
    read: ({ req }: any) => {
      // Allow public access to API for fetching exam details
      if (!req.user) return true; // Public access if user is not logged in

      const { role, instituteId } = req.user;

      if (role === 'admin') return true;

      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue =
          typeof instituteId === 'string' ? instituteId : instituteId.id;

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
    // Create access for admin and account managers only
    create: ({ req: { user } }: any) => {
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },
    // Update access for admin and account managers only
    update: ({ req: { user }, doc }: any) => {
      if (!user) return false;

      if (user.role === 'admin') return true;

      if (user.role === 'accountmanager') {
        return true;
      }

      return false;
    },
    // Prevent deletion of exams
    delete: () => false,
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
      name: 'seotitle',
      type: 'text',
      required: true,
      label: 'SEO Title',
    },   
    {
      name: 'seodescription',
      type: 'text',
      required: true,
      label: 'SEO Description',
    }, 
    {
      name: 'h1title',
      type: 'text',
      required: false,
      label: 'H1 Title',
    },            
    {
      name: 'content',
      type: 'richText',
      required: false,
      label: 'Exam Content',
    },
    {
      name: 'brandlogo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Brand Logo',
    },
    {
      name: 'exambanner',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Exam Banner',
    }, 
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },  
    {
      name: 'popular',
      type: 'checkbox',
      label: 'Popular',
      defaultValue: false,
    },    
    {
      name: 'upcoming',
      type: 'checkbox',
      label: 'Upcoming',
      defaultValue: false,
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