import { Access } from 'payload';

export const isAdminOrManager: Access = ({ req: { user } }) => {
  if (!user) {
    return false; // Deny access if no user is logged in
  }

  const { role, instituteId } = user;

  // Full access for admin
  if (role === 'admin') {
    return true; // Allow admin full access
  }

  // Restrict account managers to their own institute's data
  if (role === 'accountmanager') {
    if (!instituteId) {
      // If instituteId is missing, deny access
      return false;
    }

    return {
      instituteId: {
        equals: instituteId, // Match the Object ID directly
      },
    };
  }

  // Deny access for all other roles
  return false;
};