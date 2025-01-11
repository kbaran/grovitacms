import { Access } from 'payload'

export const isAdminOrManager: Access = ({ req: { user } }) => {
  if (!user) {
    return false // Deny access if no user is logged in
  }

  const { role, instituteId } = user

  // Full access for admin
  if (role === 'admin') {
    return true // Allow admin full access
  }

  // Restrict account managers to their own institute's data
  if (role === 'accountmanager') {
    //console.log('🚀 Brij  ~  file: isAdminOrManager.tsx:18 ~  o:', user)

    if (!instituteId?.id) {
      // If instituteId is missing, deny access
      return false
    }
    console.log("INSITUTE ID", instituteId?.id);
    return {
      instituteId: {
        equals: instituteId?.id, // Match the Object ID directly
      },
    }
  }

  // Deny access for all other roles
  return false
}
