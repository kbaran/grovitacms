import type { CollectionConfig } from 'payload';

export const Consultation: CollectionConfig = {
  slug: 'consultation',
  access: {
    read: () => true,    // ✅ Public read access
    create: () => true,  // ✅ Allow API to push data
    update: () => false, // ❌ Disallow updates
    delete: () => false, // ❌ Disallow deletions
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,  // ✅ Name is mandatory
    },
    {
      name: 'email',
      type: 'email',
      required: true,  // ✅ Email is mandatory
    },
    {
      name: 'phone',
      type: 'text',
      required: true,  // ✅ Phone is mandatory
    },
    {
      name: 'summary',
      type: 'textarea',
      required: false,  // ✅ Optional field
    },
    {
      name: 'website',
      type: 'text',
      required: false,  // ✅ Optional field
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => !!data?.createdBy,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (req.user) {
          data.createdBy = req.user.id;
        }
        return data;
      },
    ],
  },
};