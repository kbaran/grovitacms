import { Access } from 'payload';

export const isAdminOrManager: Access = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') {
    return false; // Not a valid user from the users collection
  }

  const { role, instituteId } = user;

  // Full access for admin
  if (role === 'admin') {
    return true;
  }

  // Restrict account managers and siteusers to their institute
  if (role === 'accountmanager' || role === 'siteusers') {
    if (!instituteId) {
      console.warn("⚠️ Access denied: Missing instituteId for role", role);
      return false;
    }

    return {
      instituteId: {
        equals: instituteId,
      },
    };
  }

  // All other roles denied
  return false;
};