import path from 'path'
import { en } from 'payload/i18n/en'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from '@/app/collections/Users'
import { Courses } from '@/app/collections/Courses'
import { CourseModules } from '@/app/collections/CourseModules'
import { Questions } from '@/app/collections/Questions' // Import Questions collection
import { CourseCategory } from '@/app/collections/CourseCategory'
import { Institute } from '@/app/collections/Institute'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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

export default buildConfig({
  editor: lexicalEditor(),
  collections: [
    Users, // Use the new Users collection
    Courses, // Use the new Courses collection
    CourseModules, // Use the new CourseModules collection
    Questions, // Use the new Questions collection
    CourseCategory,
    {
      slug: 'pages',
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', label: 'Page Title' },
        { name: 'content', type: 'richText', label: 'Content' },
      ],
    },
    {
      slug: 'media',
      upload: true,
      fields: [{ name: 'text', type: 'text', label: 'Text' }],
    },
    // {
    //   slug: 'coursecategories',
    //   admin: { useAsTitle: 'title' },
    //   fields: [
    //     { name: 'title', type: 'text', required: true },
    //     { name: 'description', type: 'textarea', label: 'Description' },
    //     mediaField,
    //     { name: 'slug', type: 'text', unique: true },
    //     { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    //     { name: 'isPopular', type: 'checkbox', defaultValue: false },
    //     ...statusFields,
    //   ],
    // },
    Institute, // Added Brands collection
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
