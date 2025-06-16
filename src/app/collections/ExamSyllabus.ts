import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const ExamSyllabus: CollectionConfig = {
  slug: 'examsyllabus',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return true;
      const { role, instituteId } = req.user;
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return { instituteId: { equals: typeof instituteId === 'string' ? instituteId : instituteId.id } };
      }
      return false;
    },
    create: ({ req }) =>
      req.user?.collection === 'users' &&
      (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    
    update: ({ req }) =>
      req.user?.collection === 'users' &&
      (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    delete: () => false,
  },
  admin: {
    useAsTitle: 'syllabus',
    defaultColumns: ['examCategory', 'subject', 'createdAt'],
    group: 'Exam Content',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};

        // Always ensure instituteId is set
        if (req.user?.collection === 'users' && req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId =
            typeof req.user.instituteId === 'string' ? req.user.instituteId : req.user.instituteId?.id;
          console.log("Setting instituteId from account manager:", data.instituteId);
        } else if (req.user?.collection === 'users' && req.user.role === 'admin') {
          // For admins, if instituteId not provided, use a default one
          if (!data.instituteId) {
            // Use default institute ID
            data.instituteId = "6787c1652069b549e2ad1146";
            console.log("Setting default instituteId for admin user:", data.instituteId);
          }
        }

        // ✅ Set Default Exam Category ID if not provided
        if (!data.examCategory) {
          data.examCategory = "6834529936e55b253c726463";
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: 'syllabus',
      type: 'text',
      required: true,
      label: 'Syllabus Name',
      admin: {
        description: 'Name of the syllabus',
      },
    },
    {
      name: 'weightage',
      type: 'number',
      required: false, // Optional field
      label: 'Weightage (%)',
      admin: {
        description: 'Weightage of the chapter (can include decimals)',
      },
    },    
    {
      name: 'examCategory',
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
      defaultValue: "6834529936e55b253c726463", // Default value set
    },
    {
      name: 'subject',
      type: 'select',
      required: true,
      label: 'Subject',
      options: [
        { label: 'Physics', value: 'Physics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Inorganic Chemistry', value: 'Inorganic Chemistry' },
        { label: 'Organic Chemistry', value: 'Organic Chemistry' },
        { label: 'Physical Chemistry', value: 'Physical Chemistry' },
      ],
    },
    {
      name: 'topics',
      type: 'textarea',
      required: true,
      label: 'Topics (Comma Separated)',
      admin: {
        description: 'Enter topics separated by commas, e.g., "Kinematics, Newton\'s Laws, Circular Motion"',
      },
    },
    {
      name: 'topicsCovered',
      type: 'array',
      label: 'Topics Covered',
      admin: {
        description: 'Structured list of topics (auto-generated from the comma-separated list)',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            // Parse comma-separated topics into array items
            if (siblingData.topics) {
              return siblingData.topics
                .split(',')
                .map((topicText: string) => ({ topic: topicText.trim() }))
                .filter((item: { topic: string }) => item.topic.length > 0);
            }
            return [];
          }
        ],
      },
      fields: [
        {
          name: 'topic',
          type: 'text',
          required: true,
        }
      ],
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      defaultValue: "6787c1652069b549e2ad1146",
      admin: { 
        position: 'sidebar',
        // In Payload CMS, readOnly must be a boolean, not a function
        readOnly: false,
        description: 'Institute that owns this syllabus (set automatically for account managers)'
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
      admin: {
        position: 'sidebar',
      }
    },
  ],
  endpoints: [
    // Original endpoint (keep for backward compatibility)
// Original endpoint (keep for backward compatibility) - Updated to include syllabus field
{
  path: "/by-exam/:examId",
  method: "get",
  handler: async (req: any) => {
    try {
      const payload = req.payload;
      
      // Debug information
      console.log("Request URL:", req.url);
      console.log("Request params:", req.params);
      console.log("Request query:", req.query);
      
      // Get examId using alternative methods
      let examId;
      
      // Try to get from URL path (manual parsing)
      if (req.url) {
        const urlParts = req.url.split('/');
        examId = urlParts[urlParts.length - 1];
        
        // Remove query parameters if present
        if (examId && examId.includes('?')) {
          examId = examId.split('?')[0];
        }
      }
      
      // Fallback to req.params or query parameter or default
      if (!examId) {
        examId = req.params?.examId || req.query?.examId || "6834529936e55b253c726463";
      }
      
      console.log("Extracted examId:", examId);
      
      if (!examId) {
        return Response.json(
          { message: "Exam ID is required", error: "Missing examId parameter" },
          { status: 400 }
        );
      }
      
      // Fetch all syllabus documents for this exam category with increased limit
      // Set a very high limit to ensure all records are retrieved
      const syllabusData = await payload.find({
        collection: "examsyllabus",
        where: {
          examCategory: {
            equals: examId
          },
          status: {
            equals: 'active'
          }
        },
        depth: 0, // Don't need to populate relationships
        limit: 1000, // Increased limit for large datasets
        pagination: false // Disable pagination
      });
      
      console.log(`Found ${syllabusData.docs.length} syllabus records for exam ID ${examId}`);
      
      if (!syllabusData.docs || syllabusData.docs.length === 0) {
        return Response.json(
          { message: `No syllabus found for exam ID: ${examId}`, result: [] },
          { status: 200 }
        );
      }
      
      // Transform data for easier consumption by frontend
      const syllabusResult = syllabusData.docs.map((doc: any) => {
        // Parse topics string into array
        const topicsList = doc.topics
          ? doc.topics.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
          : [];
        
        console.log(`Processing subject ${doc.subject} with ${topicsList.length} topics`);
          
        return {
          id: doc.id,
          syllabus: doc.syllabus, // Include the syllabus field name
          subject: doc.subject,
          topics: topicsList,
          description: doc.description || '',
          difficulty: doc.difficulty || 'medium',
          recommendedTimePerQuestion: doc.recommendedTimePerQuestion || 120
        };
      });
      
      // Group by subject
      const groupedBySubject: Record<string, any> = {};
      
      syllabusResult.forEach((syllabus: any) => {
        if (!groupedBySubject[syllabus.subject]) {
          groupedBySubject[syllabus.subject] = {
            subject: syllabus.subject,
            topics: [],
            syllabusItems: [], // Include syllabus items
            difficulty: syllabus.difficulty,
            recommendedTimePerQuestion: syllabus.recommendedTimePerQuestion
          };
        }
        
        // Append topics
        groupedBySubject[syllabus.subject].topics = [
          ...groupedBySubject[syllabus.subject].topics,
          ...syllabus.topics
        ];
        
        // Add syllabus item
        groupedBySubject[syllabus.subject].syllabusItems.push({
          id: syllabus.id,
          syllabus: syllabus.syllabus,
          topicsCount: syllabus.topics.length
        });
      });
      
      // Log the final result structure
      console.log(`Grouped into ${Object.keys(groupedBySubject).length} subjects`);
      Object.keys(groupedBySubject).forEach(subject => {
        console.log(`${subject}: ${groupedBySubject[subject].topics.length} topics, ${groupedBySubject[subject].syllabusItems.length} syllabus items`);
      });
      
      return Response.json(
        { 
          message: `Syllabus data fetched for exam ID: ${examId}`,
          result: Object.values(groupedBySubject)
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    } catch (error) {
      console.error("❌ Error fetching syllabus data:", error);
      return Response.json(
        { message: `Error fetching syllabus data`, error },
        { status: 500 }
      );
    }
  },
},
    
    // New endpoint using query parameters - also updated with the same fix
    {
      path: "/get-syllabus",
      method: "get",
      handler: async (req: any) => {
        try {
          const payload = req.payload;
          const examId = req.query?.examId || "6834529936e55b253c726463";
          
          console.log("Using examId from query:", examId);
          
          if (!examId) {
            return Response.json(
              { message: "Exam ID is required", error: "Missing examId parameter" },
              { status: 400 }
            );
          }
          
          // Fetch all syllabus documents for this exam category
          const syllabusData = await payload.find({
            collection: "examsyllabus",
            where: {
              examCategory: {
                equals: examId
              },
              status: {
                equals: 'active'
              }
            },
            depth: 0, // Don't need to populate relationships
            limit: 1000, // Increased limit
            pagination: false // Disable pagination
          });
          
          console.log(`Found ${syllabusData.docs.length} syllabus records for exam ID ${examId}`);
          
          if (!syllabusData.docs || syllabusData.docs.length === 0) {
            return Response.json(
              { message: `No syllabus found for exam ID: ${examId}`, result: [] },
              { status: 200 }
            );
          }
          
          // Transform data for easier consumption by frontend
          const syllabusResult = syllabusData.docs.map((doc: any) => {
            // Parse topics string into array
            const topicsList = doc.topics
              ? doc.topics.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
              : [];
              
            return {
              id: doc.id,
              subject: doc.subject,
              topics: topicsList,
              description: doc.description || '',
              difficulty: doc.difficulty || 'medium',
              recommendedTimePerQuestion: doc.recommendedTimePerQuestion || 120
            };
          });
          
          // Group by subject
          const groupedBySubject: Record<string, any> = {};
          
          syllabusResult.forEach((syllabus: any) => {
            if (!groupedBySubject[syllabus.subject]) {
              groupedBySubject[syllabus.subject] = {
                subject: syllabus.subject,
                topics: [],
                difficulty: syllabus.difficulty,
                recommendedTimePerQuestion: syllabus.recommendedTimePerQuestion
              };
            }
            
            // Append topics
            groupedBySubject[syllabus.subject].topics = [
              ...groupedBySubject[syllabus.subject].topics,
              ...syllabus.topics
            ];
          });
          
          // Log the final result structure
          console.log(`Grouped into ${Object.keys(groupedBySubject).length} subjects`);
          Object.keys(groupedBySubject).forEach(subject => {
            console.log(`${subject}: ${groupedBySubject[subject].topics.length} topics`);
          });
          
          return Response.json(
            { 
              message: `Syllabus data fetched for exam ID: ${examId}`,
              result: Object.values(groupedBySubject)
            },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
              },
            }
          );
        } catch (error) {
          console.error("❌ Error fetching syllabus data:", error);
          return Response.json(
            { message: `Error fetching syllabus data`, error },
            { status: 500 }
          );
        }
      },
    },
    
    // New specialized endpoint for subject popup (optimized for front-end)
    {
      path: "/subject-popup",
      method: "get",
      handler: async (req: any) => {
        try {
          const payload = req.payload;
          const examId = req.query?.examId || "6834529936e55b253c726463";
          
          console.log("Fetching subject data for popup, examId:", examId);
          
          if (!examId) {
            return Response.json(
              { message: "Exam ID is required", error: "Missing examId parameter" },
              { status: 400 }
            );
          }
          
          // Fetch all syllabus documents for this exam category
          const syllabusData = await payload.find({
            collection: "examsyllabus",
            where: {
              examCategory: {
                equals: examId
              },
              status: {
                equals: 'active'
              }
            },
            depth: 0,
            limit: 1000,
            pagination: false
          });
          
          if (!syllabusData.docs || syllabusData.docs.length === 0) {
            return Response.json(
              { message: `No syllabus found for exam ID: ${examId}`, result: [] },
              { status: 200 }
            );
          }
          
          // Transform and group by subject
          const groupedBySubject: Record<string, any> = {};
          
          syllabusData.docs.forEach((doc: any) => {
            const topicsList = doc.topics
              ? doc.topics.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
              : [];
              
            if (!groupedBySubject[doc.subject]) {
              groupedBySubject[doc.subject] = {
                subject: doc.subject,
                topics: [],
                difficulty: doc.difficulty || 'medium',
                recommendedTimePerQuestion: doc.recommendedTimePerQuestion || 120
              };
            }
            
            // Append topics
            groupedBySubject[doc.subject].topics = [
              ...groupedBySubject[doc.subject].topics,
              ...topicsList
            ];
          });
          
          // Remove duplicate topics (can happen when merging from multiple records)
          Object.keys(groupedBySubject).forEach(subject => {
            groupedBySubject[subject].topics = [...new Set(groupedBySubject[subject].topics)];
          });
          
          console.log(`Processed ${Object.keys(groupedBySubject).length} subjects for popup`);
          
          return Response.json(
            { 
              message: `Syllabus data fetched for exam ID: ${examId}`,
              result: Object.values(groupedBySubject)
            },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
              },
            }
          );
        } catch (error) {
          console.error("❌ Error fetching subject popup data:", error);
          return Response.json(
            { message: `Error fetching subject data`, error },
            { status: 500 }
          );
        }
      },
    }
  ]
};

export default ExamSyllabus;