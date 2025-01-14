/**
 * This is an example of a standalone script that loads in the Payload config
 * and uses the Payload Local API to query the database.
 */
'use server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Post } from '@/app/collections/Posts'
import { Campaign } from '@/app/collections/Campaigns'
import { Pages } from '@/app/collections/Pages'
import { User } from '@/app/collections/User'
import { Media } from '@/app/collections/Media'
import { Brands } from '@/app/collections/Brands'
import { Socialmedia } from '@/app/collections/Socialmedia'

// import ImageKit from 'imagekit'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { ApprovalRequest } from '@/app/collections/ApprovalRequest'
import { Influencer } from '@/app/collections/Influencer'
import { Experience } from '@/app/collections/Exprience'
import { Infuencerbrands } from '@/app/collections/Infuencerbrand'
import { Engagement } from '@/app/collections/Engagement'
import { Achivement } from '@/app/collections/Achivement'

const allCollections = {
  influencer: [Post, Brands],
  editor: [Post, Brands, Socialmedia, Campaign],
  admin: [
    Post,
    Brands,
    Socialmedia,
    Campaign,
    Influencer,
    Achivement,
    Experience,
    Infuencerbrands,
    Engagement,
    User,
    Pages,
    Media,
    ApprovalRequest,
  ],
}

const getCollectionsByRole = (role:any) => {
  console.log('🚀 Brij  ~  file: payload.config.ts:58 ~  getCollectionsByRole ~  role:', role)

  switch (role) {
    case 'influencer':
      return allCollections.influencer
    case 'editor':
      return allCollections.editor
    case 'admin':
      return allCollections.admin
    default:
      return [Post] // No access if role is unknown
  }
}

// export const roleMiddleware = (req, res, next) => {
//   // Assuming `req.user` exists after authentication
//   req.role = req.user?.role || 'viewer' // Default to 'viewer'
//   next()
// }
export const roleMiddleware = (req:any, res:any, next:any) => {
  const role = req?.user?.role || 'viewer' // Determine user role
  req.filteredCollections = getCollectionsByRole(role) // Set filtered collections in req
  next()
}
