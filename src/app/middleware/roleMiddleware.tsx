
const checkRoleAccess =
  (requiredRoles: string[]) =>
  ({ req }: { req: any }) => {
    const user = req.user;

    if (!user) return false;

    const { role } = user; // Assuming 'role' is a single string
    return requiredRoles.includes(role); // Check if user's role matches
  };

export default checkRoleAccess;
