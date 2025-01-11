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
  access: {
    read: async ({ req: { user } }) => {
      if (!user) return false;
      const { role, instituteId } = user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId?.id) {
        return {
          instituteId: {
            equals: instituteId.id,
          },
        };
      }
      return false;
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },
    update: ({ req: { user }, doc }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (user.role === 'accountmanager') {
        return doc?.createdBy?.toString() === user?.id;
      }
      return false;
    },
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, context }) => {
        if (operation === 'create' || operation === 'update') {
          if (!data.course) {
            throw new Error('Please select a related course.');
          }

          // Use the context to access payload
          const course = await context.payload.findByID({
            collection: 'courses',
            id: data.course,
            depth: 0,
          });

          if (!course) {
            throw new Error('The selected course does not exist.');
          }

          // Automatically set instituteId based on the course
          if (!data.instituteId && course.instituteId) {
            data.instituteId = course.instituteId;
          }

          // Validate module belongs to the selected course
          if (data.module) {
            const module = await context.payload.findByID({
              collection: 'course-modules',
              id: data.module,
              depth: 0,
            });

            if (!module || module.course !== data.course) {
              throw new Error(
                'The selected module does not belong to the selected course.'
              );
            }
          }
        }
        return data;
      },
    ],
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
      admin: {
        condition: (data, siblingData) => !!siblingData?.course,
      },
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
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    ...statusFields,
  ],
};