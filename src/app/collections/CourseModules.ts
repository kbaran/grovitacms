import type { CollectionConfig, BeforeValidateHook } from 'payload';

type User = {
  role: 'admin' | 'accountmanager';
  instituteId?: string | { id: string };
} | null;

// Define a generic hook handler for instituteId assignment
const handleInstituteId: BeforeValidateHook<any> = async ({ data, req }) => {
  data ??= {};

  const user = req.user as User;

  if (user?.role === 'accountmanager') {
    if (!user.instituteId) {
      throw new Error('Account managers must have an associated institute.');
    }
    data.instituteId =
      typeof user.instituteId === 'string'
        ? user.instituteId
        : (user.instituteId as { id: string })?.id ?? data.instituteId;
  }

  return data;
};

export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  access: {
    read: ({ req }) => {
      const user = req.user as User;

      if (!user) return false;

      const { role, instituteId } = user;

      if (role === 'admin') return true;

      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue =
          typeof instituteId === 'string'
            ? instituteId
            : (instituteId as { id: string })?.id;

        if (instituteIdValue) {
          return {
            instituteId: {
              equals: instituteIdValue,
            },
          };
        }
      }

      return false;
    },
    create: ({ req }) => {
      const user = req.user as User;
      return user?.role === 'admin' || user?.role === 'accountmanager';
    },
    update: ({ req }) => {
      const user = req.user as User;

      if (!user) return false;
      if (user.role === 'admin') return true;
      return false;
    },
    delete: () => false,
  },
  admin: { useAsTitle: 'module' },
  hooks: {
    beforeValidate: [handleInstituteId],
  },
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
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
    },
    {
      name: 'sequence',
      type: 'number', // Added sequence field
      label: 'Sequence',
      required: true,
      admin: {
        description: 'Set the order for rendering this module on the front-end. Lower numbers will appear first.',
      },
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'seotitle', // SEO Title added directly
      type: 'text',
      label: 'SEO Title',
      required: true,
      admin: {
        placeholder: 'Enter a concise SEO title',
      },
    },
    {
      name: 'seodescription', // SEO Description added directly
      type: 'textarea',
      label: 'SEO Description',
      required: true,
      admin: {
        placeholder: 'Write a short SEO-friendly description',
      },
    },
  ],
};