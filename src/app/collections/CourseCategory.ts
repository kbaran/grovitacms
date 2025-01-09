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
];

const mediaField = {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  label: 'Image',
};

export const CourseCategory: CollectionConfig = {
  slug: 'coursecategories',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Category Title',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    mediaField,
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'Slug',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Featured Category',
      defaultValue: false,
    },
    {
      name: 'isPopular',
      type: 'checkbox',
      label: 'Popular Category',
      defaultValue: false,
    },

    {
        name: 'createdBy',
        type: 'relationship',
        relationTo: 'users',
        access: {
         // update: () => false,
        },
        admin: {
          readOnly: true,
          position: 'sidebar',
        // condition: (data: { createdBy: any; }) => !!data?.createdBy,
        },
      },

    ...seoFields,
    ...statusFields,
  ],
};