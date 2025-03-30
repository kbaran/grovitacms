import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { Response, NextFunction } from 'express';
import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';
import axios from 'axios';

export const MockTestQuestions: CollectionConfig = {
  slug: 'mocktestquestions',
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
    create: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
    update: ({ req }) => req?.user?.role === 'admin' || req?.user?.role === 'accountmanager',
    delete: () => false,
  },
  admin: {
    useAsTitle: 'question',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};

        if (req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId =
            typeof req.user.instituteId === 'string' ? req.user.instituteId : req.user.instituteId?.id;
        }

        // ✅ Set Default Exam Category ID if not provided
        if (!data.examCategoryId) {
          data.examCategoryId = "67c43634c7d89d6e4da15d11";
        }

        return data;
      },
    ],
  },
  
  fields: [
    {
      name: 'question',
      type: 'code',
      required: true,
      label: 'Question (LaTeX Encoded)',
      admin: {
        language: 'latex',
      },
    },
    {
      name: 'questionimage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Question Image',
    },
    {
      name: 'answers',
      type: 'array',
      label: 'Answers',
      fields: [
        {
          name: 'answerText',
          type: 'code',
          required: false,
          label: 'Answer Text (LaTeX Encoded)',
          admin: {
            language: 'latex',
          },
        },
        {
          name: 'answerImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: 'Answer Image',
        },
        {
          name: 'isCorrect',
          type: 'checkbox',
          required: true,
          label: 'Is Correct Answer?',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      label: 'Institute',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'examCategoryId',  // ✅ Relationship with ExamCategory
      type: 'relationship',
      relationTo: 'examcategories',
      required: true,
      label: 'Exam Category',
      defaultValue: "67c43634c7d89d6e4da15d11", // ✅ Default value set
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Subject',
    },
    {
      name: 'topicsCovered',
      type: 'array',
      label: 'Topics Covered',
      fields: [
        {
          name: 'topic',
          type: 'text',
        },
      ],
    },
    {
      name: 'difficulty',
      type: 'select',
      label: 'Difficulty',
      options: [
        { label: "Easy", value: "easy" },
        { label: "Medium", value: "medium" },
        { label: "Hard", value: "hard" },
        { label: "Very Hard", value: "very-hard" },
      ]
    },
    {
      name: 'attempts',
      type: 'number',
      label: 'No. Of Attempts',
      defaultValue: 0,
    },
  ],
  endpoints: [
    {
      path: "/next-question",
      method: "get",
      handler: async (req: any) => {
        try {
          const payload = req.payload;
          const subjectFilter = req.query.subject;
          const isSkippedRequest = req.query.skipped === "true";

          // ✅ Get previously attempted question IDs from query params
          const attemptedQuestions = req.query.attempted ? JSON.parse(req.query.attempted) : [];
          
          let questionToReturn = null;

          // If requesting a previously skipped question
          if (isSkippedRequest && subjectFilter) {
            // Find skipped questions for this user and subject
            const skippedResponses = await payload.find({
              collection: "userresponses", // Make sure collection name is correct
              where: {
                and: [
                  {
                    isSkipped: {
                      equals: true
                    }
                  },
                  {
                    subject: {
                      equals: subjectFilter
                    }
                  },
                  {
                    userId: {
                      equals: req.user.id // Getting questions skipped by the current user
                    }
                  }
                ]
              },
              limit: 1000,
              depth:2
            });
            
            console.log("SKIPPED RESPOSNE: ",skippedResponses);
            if (skippedResponses.docs && skippedResponses.docs.length > 0) {
              // Get the question IDs from the skipped responses
              const skippedQuestionIds = skippedResponses.docs.map((response:any) => response.questionId.id);
              
              // Find those questions in the questions collection
              const skippedQuestions = await payload.find({
                collection: "mocktestquestions",
                where: {
                  id: {
                    in: skippedQuestionIds
                  }
                },
                limit: 1000
              });
              
              if (skippedQuestions.docs && skippedQuestions.docs.length > 0) {
                // Select a random skipped question
                const randomIndex = Math.floor(Math.random() * skippedQuestions.docs.length);
                questionToReturn = skippedQuestions.docs[randomIndex];
              }
            }
          }

          // If no skipped question was found or not requesting one, proceed with normal question selection
          if (!questionToReturn) {
            // ✅ Build the query conditions
            const whereCondition: any = {
              id: {
                not_in: attemptedQuestions,
              },
            };
            
            // ✅ Add subject filter if provided
            if (subjectFilter) {
              whereCondition.subject = {
                equals: subjectFilter
              };
            }

            // ✅ Fetch questions based on conditions
            const allQuestions = await payload.find({
              collection: "mocktestquestions",
              where: whereCondition,
              limit: 1000, // ✅ Fetch more questions to ensure randomness
            });

            if (!allQuestions.docs || allQuestions.docs.length === 0) {
              return Response.json(
                { 
                  message: subjectFilter 
                    ? `No questions found for subject: ${subjectFilter}` 
                    : "No results found", 
                  result: null 
                },
                {
                  headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                  },
                }
              );
            }

            // ✅ Select a truly random question
            const randomIndex = Math.floor(Math.random() * allQuestions.docs.length);
            questionToReturn = allQuestions.docs[randomIndex];
          }

          return Response.json(
            { 
              message: isSkippedRequest 
                ? "Returning previously skipped question" 
                : (subjectFilter ? `Next question fetched for subject: ${subjectFilter}!` : "Next question fetched!"), 
              result: questionToReturn 
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
          console.error("❌ Error fetching next question:", error);
          return Response.json(
            { message: `Error fetching question`, error:error },
            { status: 500 }
          );
        }
      },
    },
    
    // New endpoint following the structure of UserResponses collection
    {
      path: "/:import-question",
      method: "post",
      handler: async (req: any) => {
        try {
          const data = await req?.json();
          const { 
            question, 
            questionImageUrl, 
            options, 
            subject, 
            topics, 
            difficulty,
            instituteId 
          } = data;
          
          if (!question || !options || !subject || !instituteId) {
            return new Response(
              JSON.stringify({ error: "Missing required fields" }),
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
          
          // Process question content - clean up HTML if needed
          const cleanQuestionText = cleanHTML(question);
          
          // Handle question image if provided
          let questionImageId = null;
          if (questionImageUrl) {
            try {
              const imageResponse = await axios.get(questionImageUrl, { responseType: 'arraybuffer' });
              const buffer = Buffer.from(imageResponse.data);
              
              const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
              const fileExtension = contentType.split('/')[1] || 'jpg';
              const fileName = `question-${Date.now()}.${fileExtension}`;
              
              const mediaDoc = await req.payload.create({
                collection: 'media',
                data: {
                  alt: "Question image",
                },
                file: {
                  data: buffer,
                  mimetype: contentType,
                  name: fileName,
                  size: buffer.length,
                },
              });
              
              questionImageId = mediaDoc.id;
            } catch (imageError) {
              console.error("❌ Error processing question image:", imageError);
            }
          }
          
          // Process answer options
          const answers = [];
          for (const option of options) {
            const cleanOptionText = cleanHTML(option.text);
            let optionImageId = null;
            
            // Process option image if provided
            if (option.imageUrl) {
              try {
                const imageResponse = await axios.get(option.imageUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imageResponse.data);
                
                const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
                const fileExtension = contentType.split('/')[1] || 'jpg';
                const fileName = `option-${option.label}-${Date.now()}.${fileExtension}`;
                
                const mediaDoc = await req.payload.create({
                  collection: 'media',
                  data: {
                    alt: `Option ${option.label} image`,
                  },
                  file: {
                    data: buffer,
                    mimetype: contentType,
                    name: fileName,
                    size: buffer.length,
                  },
                });
                
                optionImageId = mediaDoc.id;
              } catch (optionImageError) {
                console.error(`❌ Error processing option ${option.label} image:`, optionImageError);
              }
            }
            
            answers.push({
              answerText: cleanOptionText,
              ...(optionImageId && { answerImage: optionImageId }),
              isCorrect: !!option.isCorrect
            });
          }
          
          // Process topics with proper typing
          const topicsCovered = topics && topics.length > 0 
            ? topics.map((topic: string) => ({ topic: topic })) 
            : [];
          
          // Create the question
          const questionData = {
            question: cleanQuestionText,
            ...(questionImageId && { questionimage: questionImageId }),
            answers,
            subject,
            topicsCovered,
            difficulty: difficulty || "medium", // Default to medium if not provided
            instituteId,
            examCategoryId: "67c43634c7d89d6e4da15d11", // Using default
          };
          
          const createdQuestion = await req.payload.create({
            collection: "mocktestquestions",
            data: questionData
          });
          
          return new Response(
            JSON.stringify({ 
              message: `Question successfully imported!`, 
              result: questionData, 
              questionId: createdQuestion.id 
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
          console.error("❌ Error importing question:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to import question" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    },
    
    // Batch import endpoint following the same structure
    {
      path: "/:batch-import",
      method: "post",
      handler: async (req: any) => {
        try {
          const data = await req?.json();
          const { questions, instituteId } = data;
          
          if (!Array.isArray(questions) || questions.length === 0 || !instituteId) {
            return new Response(
              JSON.stringify({ error: "Invalid request data. Expected questions array and instituteId" }),
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
          
          const results = [];
          const errors = [];
          
          // Process each question
          for (let i = 0; i < questions.length; i++) {
            try {
              const questionData = questions[i];
              
              // Process question content
              const cleanQuestionText = cleanHTML(questionData.question);
              
              // Handle question image if provided
              let questionImageId = null;
              if (questionData.questionImageUrl) {
                try {
                  const imageResponse = await axios.get(questionData.questionImageUrl, { responseType: 'arraybuffer' });
                  const buffer = Buffer.from(imageResponse.data);
                  
                  const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
                  const fileExtension = contentType.split('/')[1] || 'jpg';
                  const fileName = `question-${i}-${Date.now()}.${fileExtension}`;
                  
                  const mediaDoc = await req.payload.create({
                    collection: 'media',
                    data: {
                      alt: `Question ${i+1} image`,
                    },
                    file: {
                      data: buffer,
                      mimetype: contentType,
                      name: fileName,
                      size: buffer.length,
                    },
                  });
                  
                  questionImageId = mediaDoc.id;
                } catch (imageError) {
                  console.error(`❌ Error processing question ${i+1} image:`, imageError);
                }
              }
              
              // Process answer options
              const answers = [];
              if (Array.isArray(questionData.options)) {
                for (const option of questionData.options) {
                  const cleanOptionText = cleanHTML(option.text);
                  let optionImageId = null;
                  
                  // Process option image if provided
                  if (option.imageUrl) {
                    try {
                      const imageResponse = await axios.get(option.imageUrl, { responseType: 'arraybuffer' });
                      const buffer = Buffer.from(imageResponse.data);
                      
                      const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
                      const fileExtension = contentType.split('/')[1] || 'jpg';
                      const fileName = `option-${option.label}-${Date.now()}.${fileExtension}`;
                      
                      const mediaDoc = await req.payload.create({
                        collection: 'media',
                        data: {
                          alt: `Question ${i+1} Option ${option.label} image`,
                        },
                        file: {
                          data: buffer,
                          mimetype: contentType,
                          name: fileName,
                          size: buffer.length,
                        },
                      });
                      
                      optionImageId = mediaDoc.id;
                    } catch (optionImageError) {
                      console.error(`❌ Error processing Q${i+1} option ${option.label} image:`, optionImageError);
                    }
                  }
                  
                  answers.push({
                    answerText: cleanOptionText,
                    ...(optionImageId && { answerImage: optionImageId }),
                    isCorrect: !!option.isCorrect
                  });
                }
              }
              
              // Process topics with proper typing
              const topics = questionData.topics || [];
              const topicsCovered = topics.length > 0 
                ? topics.map((topic: string) => ({ topic: topic })) 
                : [];
              
              // Create the question object
              const newQuestionData = {
                question: cleanQuestionText,
                ...(questionImageId && { questionimage: questionImageId }),
                answers,
                subject: questionData.subject || "General",
                topicsCovered,
                difficulty: questionData.difficulty || "medium",
                instituteId,
                examCategoryId: "67c43634c7d89d6e4da15d11", // Using default
              };
              
              // Save to database
              const createdQuestion = await req.payload.create({
                collection: "mocktestquestions",
                data: newQuestionData
              });
              
              results.push({
                id: createdQuestion.id,
                question: cleanQuestionText.substring(0, 30) + "...",
                success: true
              });
              
            } catch (questionError) {
              console.error(`❌ Error processing question ${i+1}:`, questionError);
              errors.push({
                index: i,
                error: questionError,
                question: questions[i].question ? (questions[i].question.substring(0, 30) + "...") : "Unknown"
              });
            }
          }
          
          return new Response(
            JSON.stringify({ 
              message: `Batch import completed: ${results.length} succeeded, ${errors.length} failed`,
              result: { results, errors, total: questions.length }
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
          console.error("❌ Error in batch import:", error);
          return new Response(
            JSON.stringify({ error: error || "Failed to process batch import" }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }
    }
  ],
};

// Helper function to clean HTML content
function cleanHTML(html: any): string {
  if (!html) return "";
  if (typeof html !== 'string') return String(html);
  
  // Simple HTML to text conversion - replace with more sophisticated parser if needed
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
    .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ')        // Replace non-breaking spaces
    .replace(/&lt;/g, '<')          // Replace escaped characters
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();                         // Trim leading/trailing whitespace
    
  return text;
}

export default MockTestQuestions;