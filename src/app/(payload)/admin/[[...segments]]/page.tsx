/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'

import config from '@payload-config'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

// Corrected Args Type
type Args = {
  params: {
    segments: string[] // Array of route segments
  }
  searchParams?: Record<string, string | string[]> // Optional
}

// Fixing generateMetadata function
export const generateMetadata = async ({
  params,
  searchParams,
}: Args): Promise<Metadata> => {
  return generatePageMetadata({
    config,
    params,
    searchParams,
  })
}

// Fixing the Page component
const Page = ({ params, searchParams }: Args) => {
  return RootPage({
    config,
    params,
    searchParams,
    importMap,
  })
}

export default Page