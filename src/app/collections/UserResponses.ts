import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const UserResponses: CollectionConfig = {
  slug: 'userresponses',
  access: {
    read: ({ req }: any) => {
        // Always return true if using an admin API key
        // if (req.headers.authorization === `Bearer ${process.env.PAYLOAD_API_KEY}`) {
        //   return true;
        // }
  
        console.log(req.user)
        // For regular authenticated users
        if (!req.user) return false;
  
        // Admins and account managers can read all responses
        if (req.user.role === 'admin' || req.user.role === 'accountmanager') {
          return true;
        }
  
        // Regular users can only see their own responses
        return { userId: { equals: req.user.id } };
      },
    create: ({ req }) => !!req.user, // Only authenticated users can create responses
    update: ({ req }) => false, // Prevent users from modifying responses
    delete: ({ req }) => req?.user?.role === 'admin', // Only admins can delete
  },
  admin: {
    useAsTitle: 'questionId',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};
        // No userId overriding here - good!
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'userId', // ✅ ID of the user answering the question
      type: 'text',
      required: true,
      label: 'User ID',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'questionId', // ✅ Reference to `MockTestQuestions`
      type: 'relationship',
      relationTo: 'mocktestquestions',
      required: true,
      label: 'Mock Test Question',
    },
    {
      name: 'categoryId', // ✅ Reference to `ExamCategory`
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
    },
    {
      name: 'subject', // ✅ Subject name
      type: 'text',
      required: true,
      label: 'Subject',
    },
    {
      name: 'topics', // ✅ Topics covered (comma-separated)
      type: 'text',
      required: false,
      label: 'Topics Covered (Comma-Separated)',
    },
    {
      name: 'difficulty', // ✅ Difficulty level
      type: 'select',
      required: true,
      label: 'Difficulty',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' },
        { label: 'Very Hard', value: 'very-hard' },
      ],
    },
    {
      name: 'timeSpent', // ✅ Time spent on the question (in seconds)
      type: 'number',
      required: true,
      label: 'Time Spent (Seconds)',
      defaultValue: 0,
    },
    {
      name: 'isCorrect', // ✅ Whether the answer was correct (0 = wrong, 1 = correct)
      type: 'checkbox',
      required: false,
      label: 'Correct Answer',
    },
    {
        name: 'isSkipped', // ✅ Whether the answer was correct (0 = wrong, 1 = correct)
        type: 'checkbox',
        required: true,
        label: 'Skip Question',
        defaultValue: false,
      },    
      {
        name: 'skipCount', // ✅ Time spent on the question (in seconds)
        type: 'number',
        required: true,
        label: 'Times Skipped',
        defaultValue: 0,
      },      
  ],
  endpoints: [
    // ADD RESPONSE ENDPOINT
    {
      path: '/:add-response',
      method: 'post',
      handler: async (req: any) => {
        try {
          const data = await req?.json();
          
          // Only set userId if not already provided in the request
          if (!data.userId) {
            // Fallback to authenticated user ID only if no userId is provided
            if (req.user?.id) {
              data.userId = req.user.id;
            } else {
              return new Response(
                JSON.stringify({ error: "User ID is required but not provided" }),
                { 
                  status: 400,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                  }
                }
              );
            }
          }

          // Create the response in the collection
          const response = await req.payload.create({
            collection: 'userresponses',
            data: data,
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Data successfully added!`, 
              result: data, 
              responseId: response.id 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        } catch (error) {
          console.error("Error saving response:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to save response" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      },
    }
]
};

export default UserResponses;