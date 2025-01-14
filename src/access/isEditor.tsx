import { Access } from 'payload'

export const isEditor: Access = ({ req: { user } }) => {
  const role = (user?.role ?? []) as string[] // Assert type to string[]
  if (user) {
    if (role?.includes('editor')) {
      return true
    }
    // return {
    //   createdBy: { equals: user?.id },
    // }
  }

  return false
}
