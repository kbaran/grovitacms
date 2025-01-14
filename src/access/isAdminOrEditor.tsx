import { Access } from 'payload'

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  if (!user) {
    return false // Deny access if no user is logged in
  }

  const role = user.role

  // Full access for admin
  if (role?.includes('admin')) {
    return true
  }

  // Restrict influencers to their own data
  if (role?.includes('editor')) {
    return {
      createdBy: {
        equals: user.id, // Only allow access to their own data
      },
    }
  }

  // Deny access for all other roles
  return false
}
