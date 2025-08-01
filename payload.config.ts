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
import { Widget1 } from '@/app/collections/Widget1'
import { Consultation } from '@/app/collections/Consultation'
import { PricePlans } from '@/app/collections/PricePlans'
// import ImageKit from 'imagekit'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { Purchases } from '@/app/collections/Purchases'
import { ExamCategory } from '@/app/collections/ExamCategory'
import { MockTestQuestions } from '@/app/collections/MockTextQuestions'
import UserResponses from '@/app/collections/UserResponses'
import { MockTestPurchases } from '@/app/collections/MockTestPurchases'
import { MockTestPricePlans } from '@/app/collections/MockTestPricePlans'
import ExamSyllabus from '@/app/collections/ExamSyllabus'
import UserLearningResume from '@/app/collections/UserLearningResume'
import StudentRegistrations from '@/app/collections/StudentRegistration'
import InstituteLeads from '@/app/collections/InstituteLeads'
import { DiscountCodes } from '@/app/collections/DicountCodes'
import { UpgradePlanPurchases } from '@/app/collections/UpgradePlanPurchase'
import { GCoinTransactions } from '@/app/collections/GCoinTransactions'
import { MockTests } from '@/app/collections/MockTests'
import { MockTestQuestionSets } from '@/app/collections/MockTestQuestionSets'
import MockTestEnrollments from '@/app/collections/MockTestEnrollments'
import MockTestAttempts from '@/app/collections/MockTestAttempts'
import { MockTestSubmissions } from '@/app/collections/MockTestSubmissions'

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
  
  csrf: ['http://localhost:3002','http://localhost:3003', 'https://onionpose.com', 'https://payload-3-0-pi.vercel.app','https://grovitacms.vercel.app','https://grovita.in','https://glp-eta.vercel.app','http://localhost:3005','https://learning.grovita.in'],
  cors: ['http://localhost:3002','http://localhost:3003', 'https://onionpose.com', 'https://payload-3-0-pi.vercel.app','https://grovitacms.vercel.app','https://grovita.in','https://glp-eta.vercel.app','http://localhost:3005','https://learning.grovita.in'],
  collections: [
    Users,
    Institute,
    CourseCategory,
    Courses,
    CourseModules,
    Widget1,
    Consultation,
    PricePlans,
    MockTests,
    Purchases,
    MockTestPricePlans,
    ExamSyllabus,
    MockTestEnrollments,
    MockTestAttempts,
    MockTestPurchases,
    MockTestSubmissions,
    ExamCategory,
    MockTestQuestions,
    UserLearningResume,
    UserResponses,
    StudentRegistrations,
    UpgradePlanPurchases,
    InstituteLeads,
    DiscountCodes,
    GCoinTransactions,
    MockTestQuestionSets,
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
      access: {
        read: () => true, // ✅ Allow everyone to read media
        create: ({ req }) => !!req.user, // ✅ Only logged-in users can upload
        update: ({ req }) =>
          req.user?.collection === 'users' && req.user.role === 'admin',
        delete: ({ req }) =>
          req.user?.collection === 'users' && req.user.role === 'admin',
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
          instituteId: '1234',
          userType: 'student',        // ✅ added
          phone_number: '9999999999',
          xp: 0,
          xpSpent: 0,
          plan:'free',
          xpEarnedThisWeek: 0,
          lastXPUpdateAt: new Date().toISOString(),
          level: 1,
        },
      })
    }
  },
  sharp,
  // endpoints: [forceLoginEndpoint],
})
