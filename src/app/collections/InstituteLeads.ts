import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const InstituteLeads: CollectionConfig = {
  slug: 'instituteleads',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false;
      const { role } = req.user;
      return role === 'admin' || role === 'accountmanager';
    },
    create: () => true, // Anyone can submit an institute lead
    update: ({ req }) =>
  req.user?.collection === 'users' &&
  (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    delete: ({ req }) => req?.user?.role === 'admin',
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Contact Person Name',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Phone Number',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'Email Address',
    },
    {
      name: 'instituteName',
      type: 'text',
      required: true,
      label: 'Institute Name',
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'City',
    },
  ],
};

export default InstituteLeads;