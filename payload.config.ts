import path from 'path'
import { en } from 'payload/i18n/en'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Shared Fields
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
]

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
    hooks: {
      beforeChange: ({ data }) => {
        if (!data.token) {
          data.token = uuidv4()
        }
        return data
      },
    },
  },
]

const mediaField = {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  label: 'Image',
}

// Questions Collection
const QuestionsCollection = {
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
        condition: (data) => data.type === 'single-choice' || data.type === 'multi-choice',
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
}

export default buildConfig({
  editor: lexicalEditor(),
  collections: [
    // Users Collection
    {
      slug: 'users',
      auth: true,
      access: {
        delete: () => false,
        update: () => true,
      },
      fields: [
        { name: 'username', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true, unique: true },
        mediaField,
        { name: 'linkedin_link', type: 'text', admin: { placeholder: 'https://linkedin.com/in/your-profile' } },
        { name: 'twitter_link', type: 'text', admin: { placeholder: 'https://twitter.com/your-profile' } },
        ...statusFields,
      ],
    },

    // Pages Collection
    {
      slug: 'pages',
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', label: 'Page Title' },
        { name: 'content', type: 'richText', label: 'Content' },
      ],
    },

    // Media Collection
    {
      slug: 'media',
      upload: true,
      fields: [{ name: 'text', type: 'text', label: 'Text' }],
    },

    // Courses Collection
    {
      slug: 'courses',
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'textarea', required: true },
        mediaField,
        { name: 'category', type: 'relationship', relationTo: 'coursecategories', required: true },
        { name: 'slug', type: 'text', unique: true },
        { name: 'isFeatured', type: 'checkbox', defaultValue: false },
        { name: 'isPopular', type: 'checkbox', defaultValue: false },
        ...seoFields,
        ...statusFields,
      ],
    },

    // Course Categories Collection
    {
      slug: 'coursecategories',
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', label: 'Description' },
        mediaField,
        { name: 'slug', type: 'text', unique: true },
        { name: 'isFeatured', type: 'checkbox', defaultValue: false },
        { name: 'isPopular', type: 'checkbox', defaultValue: false },
        ...seoFields,
        ...statusFields,
      ],
    },

    // Course Modules Collection
    {
      slug: 'course-modules',
      admin: { useAsTitle: 'module' },
      fields: [
        { name: 'course', type: 'relationship', relationTo: 'courses', required: true },
        { name: 'module', type: 'text', required: true },
        {
          name: 'topics',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
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
                { name: 'title', type: 'text', required: true },
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
    },

    // Questions Collection
    QuestionsCollection,
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  i18n: { supportedLanguages: { en } },
  admin: {
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  async onInit(payload) {
    const existingUsers = await payload.find({ collection: 'users', limit: 1 })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })
    }
  },
  sharp,
})