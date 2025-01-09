import type { CollectionConfig } from 'payload'

export const Institute: CollectionConfig = {
  slug: 'institute',
  access: {
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'institutelogo',
      type: 'upload',
      relationTo: 'media',
      required: false,
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
          // if (operation === 'create') {
          //   data.updatedBy = req.user.id
          //   data.createdBy = req.user.id
          // } else if (operation === 'update') {
          data.createdBy = req.user.id
          //}
          return data
        }
      },
    ],
  },
}
