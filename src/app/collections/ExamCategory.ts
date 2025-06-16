import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const ExamCategory: CollectionConfig = {
  slug: 'examcategories',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return { instituteId: { equals: typeof instituteId === 'string' ? instituteId : instituteId.id } };
      }
      return false;
    },
    create: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
    update: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
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
        data ??= {};
    
        if (req.user?.collection === 'users' && req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId =
            typeof req.user.instituteId === 'string'
              ? req.user.instituteId
              : req.user.instituteId?.id;
        } else if (req.user?.role === 'admin') {
          // ✅ Set default instituteId for admins
          data.instituteId = '6787c1652069b549e2ad1146';
        }
    
        return data;
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Category Title' },
    { name: 'slug', type: 'text', required: true, label: 'Category Slug' },
    { name: 'seotitle', type: 'text', required: true, label: 'SEO Title' },
    { name: 'seodescription', type: 'text', required: true, label: 'SEO Description' },
    { name: 'h1title', type: 'text', required: false, label: 'H1 Title' },
    { name: 'content', type: 'richText', required: false, label: 'Exam Content' },
    { name: 'brandlogo', type: 'upload', relationTo: 'media', required: false, label: 'Brand Logo' },
    { name: 'exambanner', type: 'upload', relationTo: 'media', required: false, label: 'Exam Banner' },
    { name: 'active', type: 'checkbox', label: 'Active', defaultValue: true },
    { name: 'popular', type: 'checkbox', label: 'Popular', defaultValue: false },
    { name: 'upcoming', type: 'checkbox', label: 'Upcoming', defaultValue: false },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
};