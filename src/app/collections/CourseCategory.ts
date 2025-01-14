import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  access: {
    // Read Access
    read: ({ req: { user } }) => {
      if (!user) return false;

      const { role, instituteId } = user;

      // Admins can read all categories
      if (role === 'admin') {
        return true;
      }

      // Account Managers can only read categories of their institute
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId,
          },
        };
      }

      return false; // Deny access for all other roles
    },

    // Create Access
    create: ({ req: { user} }) => {
      return true
      // if (!user) return false;

      // const { role, instituteId } = user;
      // console.log("User role value ",role)
      // if(role == 'admin'){
      //   return true
      // }
      // return  role == 'accountmanager';

    },

    // Update Access
    update: ({ req: { user } }) => {
      
      if (!user) return false;

      const { role, instituteId } = user;

      // Admins can update all categories
      if (role === 'admin') {
        return true;
      }

      // Account Managers can update only categories of their institute
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId,
          },
        };
      }

      return false; // Deny access for all other roles
    },

    // Delete Access
    delete: ({ req: { user } }) => {
      if (!user) return false;

      const { role, instituteId } = user;

      // Admins can delete all categories
      if (role === 'admin') {
        return true;
      }

      // Account Managers can delete only categories of their institute
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: instituteId,
          },
        };
      }

      return false; // Deny access for all other roles
    },
  },
  admin: {
    useAsTitle: 'title',
  },
  // hooks: {
  //   beforeChange: [
  //     ({ data, req }) => {
  //       if (req.user?.role === 'accountmanager') {
  //         // Automatically assign the instituteId
  //         data.instituteId = req.user.instituteId?.id;
  //       }
  //       return data;
  //     },
  //   ],
  // },
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
        // readOnly: true, // Prevent manual editing
        position: 'sidebar',
        condition: (_, { user }) => {
          // Only show the field if the user has an instituteId
          return user?.instituteId;
        },
      },
      // hooks: {
      //   beforeValidate: [
      //     ({ data, user }:any) => {
      //       if (user?.instituteId) {
      //         // Auto-fill the field with the logged-in user's instituteId
      //         data.instituteId = user.instituteId;
      //       }
      //       return data;
      //     },
      //   ],
      // },
    },
  ],
};