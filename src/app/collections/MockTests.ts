import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const MockTests: CollectionConfig = {
  slug: 'mocktests',
  access: {
    read: () => true,
    create: isAdminOrManager,
    update: isAdminOrManager,
    delete: isAdminOrManager,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Mock Tests',
    defaultColumns: ['title', 'subject', 'examDate', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'shortDescription',
      type: 'text',
      label: 'Short Description',
      required: false,
      admin: {
        description: 'Optional short description shown in listings',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: false,
      admin: {
        
        description: 'Full description of the mock test',
      },
    },
    {
      name: 'isPaid',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: false,
      admin: {
        description: 'If paid, specify G-Coins cost',
      },
    },
    {
      name: 'subject',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Physics', value: 'Physics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Inorganic Chemistry', value: 'Inorganic Chemistry' },
        { label: 'Organic Chemistry', value: 'Organic Chemistry' },
        { label: 'Physical Chemistry', value: 'Physical Chemistry' },
      ],
    },
    {
      name: 'examCategory',
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'questionGenerationRules',
      type: 'group',
      admin: {
        description: 'Rules to auto-generate question sets based on syllabus (chapters) and difficulty mix.',
      },
      fields: [
        {
          name: 'syllabusFilters',
          type: 'array',
          label: 'Chapter Filters',
          required: false,
          admin: {
            description: 'Select syllabus chapters to pull topics/questions from.',
          },
          fields: [
            {
              name: 'chapter',
              type: 'relationship',
              relationTo: 'examsyllabus',
              required: true,
            },
          ],
        },
        {
          name: 'difficultyDistribution',
          type: 'group',
          fields: [
            { name: 'easy', type: 'number', defaultValue: 0 },
            { name: 'medium', type: 'number', defaultValue: 0 },
            { name: 'hard', type: 'number', defaultValue: 0 },
            { name: 'very-hard', type: 'number', defaultValue: 0 },
          ],
        },
        {
          name: 'totalQuestions',
          type: 'number',
          required: false,
          admin: {
            description: 'Total number of questions to be generated',
          },
        },
      ],
    },
    {
      name: "startDate",
      type: "date",
      required: true,
      admin: {
        description: "Test is available from this date.",
        position: "sidebar",
      },
    },
    {
      name: "endDate",
      type: "date",
      required: true,
      admin: {
        description: "Test is available until this date.",
        position: "sidebar",
      },
    },
    {
      name: "showResultsAfterEndDate",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "If enabled, results will show only after test ends.",
        position: "sidebar",
      },
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      admin: {
        description: 'Duration in minutes',
      },
    },
    {
      name: 'negativeMarking',
      type: 'checkbox',
      defaultValue: true,
      required: false,
      admin: {
        description: 'Enable or disable negative marking',
      },
    },
    {
      name: 'marksPerCorrect',
      type: 'number',
      defaultValue: 4,
      required: false,
      admin: {
        description: 'Marks for each correct answer',
      },
    },
    {
      name: 'marksPerIncorrect',
      type: 'number',
      defaultValue: -1,
      required: false,
      admin: {
        description: 'Marks deducted per incorrect answer',
      },
    },
    {
      name: 'allowCalculator',
      type: 'checkbox',
      defaultValue: false,
      required: false,
      admin: {
        description: 'Allow calculator during test?',
      },
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      admin: {
        description: 'Optional tags or labels for filtering/search',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};

export default MockTests;