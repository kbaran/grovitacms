import { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
  if (user?.collection === 'users' && user.role === 'admin') {
    return true
  }
  return false
}