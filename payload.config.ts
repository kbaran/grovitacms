// import { Achivement } from './payload-types'
import path from 'path'
import { en } from 'payload/i18n/en'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig, GlobalConfig } from 'payload'
import { v4 as uuidv4 } from 'uuid';

import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Institute } from '@/app/collections/Institute'
import { Users } from '@/app/collections/Users'
import { CourseCategory } from '@/app/collections/CourseCategory'
import { CourseModules } from '@/app/collections/CourseModules'
import { Courses } from '@/app/collections/Courses'
import { Questions } from '@/app/collections/Questions'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

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
      beforeChange: ({ data }: any) => {
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
  debug: true,
  editor: lexicalEditor(),
  csrf: ['http://localhost:3002', 'https://onionpose.com', 'https://payload-3-0-pi.vercel.app', 'https://grovitacms.vercel.app'],
  collections: [
    Users,
    Institute,
    CourseCategory,
    Courses,
    CourseModules,
    Questions,
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
      hooks: {
        afterChange: [
          async ({ doc, req, operation }) => {
            if (operation === 'create') {
              const { id } = doc
              const mediaURL = `${process.env.BLOB_BASE_URL}/${id}`

              // Update the media document to include the URL
              await req.payload.update({
                collection: 'media',
                id,
                data: { url: mediaURL },
              });
            }
          },
        ],
      },
    },
  ],
  plugins: [
    vercelBlobStorage({
      enabled: true, // Optional, defaults to true
      // Specify which collections should use Vercel Blob
      collections: {
        media: true,
        'media-with-prefix': {
          prefix: 'my-prefix',
        },
      },
      // Token provided by Vercel once Blob storage is added to your Vercel project
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    }),
  ],

  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  i18n: {
    supportedLanguages: { en },
  },
  admin: {
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  async onInit(payload) {
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          username: 'admin',
          name: 'Admin',
          password: 'test',
          role: 'admin', // Ensure the role is provided
          instituteId: '1234',
        },
      })
    }
  },
  sharp,
})