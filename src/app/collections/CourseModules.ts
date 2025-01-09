import { CollectionConfig } from 'payload/types';

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

export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  admin: { useAsTitle: 'module' },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'module',
      type: 'text',
      required: true,
    },
    {
      name: 'topics',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content',
        },
        {
          name: 'video',
          type: 'text',
          label: 'Video URL',
          admin: {
            placeholder: 'https://example.com/video',
          },
        },
        {
          name: 'subtopics',
          type: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Subtopic Content',
            },
            {
              name: 'video',
              type: 'text',
              label: 'Subtopic Video URL',
              admin: {
                placeholder: 'https://example.com/video',
              },
            },
          ],
        },
      ],
    },
    ...seoFields,
    ...statusFields,
  ],
};