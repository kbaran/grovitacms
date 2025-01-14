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
// import ImageKit from 'imagekit'
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
      beforeChange: ({ data }:any) => {
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


// Initialize ImageKit
// const imagekit = new ImageKit({
//   publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
//   privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
//   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
// })

export default buildConfig({
  debug: true,
  editor: lexicalEditor(),
  // collections: [Post, Campaign, User, Pages, Media],
  csrf: ['http://localhost:3000', 'https://onionpose.com', 'https://payload-3-0-pi.vercel.app'],
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
    components: {
      // views: {
      //   customView: {
      //     Component: '/path/to/MyCustomView#MyCustomView',
      //     path: '/my-custom-view',
      //   }
      // },
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
          token:"1234",
          instituteId: '1234',
        },
      })
    }
  },
  sharp,
  // endpoints: [forceLoginEndpoint],
})
