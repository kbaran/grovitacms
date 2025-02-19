import type { CollectionConfig, PayloadRequest } from 'payload';

type User = {
  role: 'admin' | 'accountmanager';
  instituteId?: string | { id: string };
} | null;

// Define a generic hook handler for instituteId assignment
const handleInstituteId = async ({
  data,
  req,
}: {
  data?: any; // `data` is optional in Payload hooks
  req: PayloadRequest;
}) => {
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
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        const instituteIdValue = typeof instituteId === 'string' ? instituteId : instituteId.id;
        if (instituteIdValue) {
          return { instituteId: { equals: instituteIdValue } };
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
      return user?.role === 'admin' || user?.role === 'accountmanager'; 
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
      type: 'number',
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
      name: 'seotitle',
      type: 'text',
      label: 'SEO Title',
      required: true,
      admin: {
        placeholder: 'Enter a concise SEO title',
      },
    },
    {
      name: 'seodescription',
      type: 'textarea',
      label: 'SEO Description',
      required: true,
      admin: {
        placeholder: 'Write a short SEO-friendly description',
      },
    },
    {
      name: 'resources',
      type: 'array',
      label: 'Resources (Optional)',
      required: false, // ✅ This makes it optional
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
      ],
      admin: {
        description: 'Upload multiple PDFs, Excel, or Doc files for this module.',
      },
    },
  ],
};