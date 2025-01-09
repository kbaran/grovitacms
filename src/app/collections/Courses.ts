import { CollectionConfig } from 'payload/types';

const seoFields = [
  {
    name: 'seotitle',
    type: 'text',
    label: 'SEO Title',
  },
  {
    name: 'seodescription',
    type: 'textarea',
    label: 'SEO Description',
  },
];

const statusFields = [
  {
    name: 'active',
    type: 'checkbox',
    label: 'Active',
    defaultValue: true,
  },
  {
    name: 'token',
    type: 'text',
    unique: true,
    admin: {
      readOnly: true,
    },
  },
];

const mediaField = {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  label: 'Image',
};

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'summary', type: 'textarea', required: true },
    mediaField,
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'coursecategories',
      required: true,
    },
    { name: 'slug', type: 'text', unique: true },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    { name: 'isPopular', type: 'checkbox', defaultValue: false },
    ...seoFields,
    ...statusFields,
  ],
};