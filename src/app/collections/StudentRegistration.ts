import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const StudentRegistrations: CollectionConfig = {
  slug: 'studentregistrations',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false;
      const { role } = req.user;
      return role === 'admin' || role === 'accountmanager';
    },
    create: () => true, // Anyone can register
    update: ({ req }) =>
  req.user?.collection === 'users' &&
  (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    delete: ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'admin',
  },
  admin: {
    useAsTitle: 'studentName',
  },
  fields: [
    {
      name: 'studentName',
      type: 'text',
      required: true,
      label: 'Student Name',
    },
    {
      name: 'studentEmail',
      type: 'email',
      label: 'Student Email',
    },
    {
      name: 'studentPhone',
      type: 'text',
      label: 'Student Phone Number',
    },
    {
      name: 'currentClass',
      type: 'select',
      label: 'Current Class',
      required: true,
      options: [
        { label: 'IXth', value: '9' },
        { label: 'Xth', value: '10' },
        { label: 'XIth', value: '11' },
        { label: 'XIIth', value: '12' },
      ],
    },
    {
      name: 'targetExamYear',
      type: 'select',
      label: 'Target Exam Year',
      options: [
        { label: '2025', value: '2025' },
        { label: '2026', value: '2026' },
        { label: '2027', value: '2027' },
        { label: '2028', value: '2028' },
        { label: '2029', value: '2029' },
        { label: '2030', value: '2030' },
      ],
    },
    {
      name: 'goal',
      type: 'textarea',
      label: 'Goal (e.g., IIT-JEE)',
    },
    {
      name: 'guardianName',
      type: 'text',
      label: 'Guardian Name',
    },
    {
      name: 'guardianPhone',
      type: 'text',
      label: 'Guardian Phone Number',
    },
    {
      name: 'guardianEmail',
      type: 'email',
      label: 'Guardian Email',
    },
  ],
};

export default StudentRegistrations;
