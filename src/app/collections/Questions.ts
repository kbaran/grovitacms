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

export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: {
    useAsTitle: 'question',
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      label: 'Related Course',
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'course-modules',
      required: false,
      label: 'Related Module',
    },
    {
      name: 'question',
      type: 'text',
      required: true,
      label: 'Question Text',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Single Choice', value: 'single-choice' },
        { label: 'Multiple Choice', value: 'multi-choice' },
        { label: 'Text', value: 'text' },
      ],
      required: true,
      label: 'Question Type',
    },
    {
      name: 'options',
      type: 'array',
      admin: {
        condition: (data) =>
          data.type === 'single-choice' || data.type === 'multi-choice',
      },
      fields: [
        {
          name: 'option',
          type: 'text',
          required: true,
        },
        {
          name: 'isCorrect',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'correctAnswer',
      type: 'text',
      admin: {
        condition: (data) => data.type === 'text',
      },
    },
    ...statusFields,
  ],
};