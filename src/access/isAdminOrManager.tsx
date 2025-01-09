import { Access } from 'payload';

export const isAdminOrManager: Access = ({ req: { user } }) => {
  if (!user) {
    return false; // Deny access if no user is logged in
  }

  const role = user.role;

  // Full access for admin
  if (role === 'admin') {
    return true;
  }

  // Restrict account managers to their own institute's data
  if (role === 'accountmanager') {
    return {
      'institute.id': {
        equals: user.instituteId, // Ensure user has an `instituteId` property
      },
    };
  }

  // Deny access for all other roles
  return false;
};