import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { Response, NextFunction } from 'express';
import type { CollectionConfig } from 'payload';
import { addDataAndFileToRequest } from '@payloadcms/next/utilities';
import axios from 'axios';
import { recommendQuestionsFromResume } from "../utils/questionRecommender";

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
    create: ({ req }) =>
      req.user?.collection === 'users' &&
      (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    
    // ✅ UPDATED update access rule
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
  
    delete: () => false,
  },
  admin: {
    useAsTitle: 'question',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        data ??= {};

        if (req.user?.collection === 'users' && req.user?.role === 'accountmanager') {
          if (!req.user.instituteId) {
            throw new Error('Account managers must have an associated institute.');
          }
          data.instituteId =
            typeof req.user.instituteId === 'string' ? req.user.instituteId : req.user.instituteId?.id;
        }

        // ✅ Set Default Exam Category ID if not provided
        if (!data.examCategoryId) {
          data.examCategoryId = "6834529936e55b253c726463";
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
      defaultValue: "6834529936e55b253c726463", // ✅ Default value set
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Subject',
    },
    {
      name: 'syllabus',
      type: 'text',
      required: true,
      label: 'Syllabus',
    },    
    {
  name: 'isReported',
  type: 'checkbox',
  label: 'Is Reported?',
  defaultValue: false,
  admin: { position: 'sidebar' }
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
          const syllabusFilter = req.query.syllabus ? JSON.parse(req.query.syllabus) : null;
          const incorrectOnly = req.query.incorrectOnly === "true";
          const skippedOnly = req.query.skippedOnly === "true";
          const attemptedQuestions = req.query.attempted ? JSON.parse(req.query.attempted) : [];
      
          const userId = req.user?.id || req.query.userId;
          console.log("🔥 [REQ] User ID:", userId);
          console.log("🛡️ Auth Header:", req.headers.authorization);
          console.log("👤 Decoded user object:", req.user);
          console.log("🔥 [REQ] User ID:", userId);
          console.log("📚 [REQ] Subject Filter:", subjectFilter);
          console.log("🧾 [REQ] Syllabus Filter:", syllabusFilter);
          console.log("⏭️ [REQ] Incorrect Only:", incorrectOnly, "| Skipped Only:", skippedOnly);
          console.log("🧪 [REQ] Attempted Questions:", attemptedQuestions.length);
      
          let questionToReturn = null;
      
          // If requesting incorrect questions
          if (incorrectOnly && userId) {
            const incorrectResponses = await payload.find({
              collection: "userresponses",
              where: {
                and: [
                  { isCorrect: { equals: false } },
                  { isSkipped: { equals: false } },
                  { userId: { equals: userId } },
                  ...(subjectFilter ? [{ subject: { equals: subjectFilter } }] : [])
                ]
              },
              limit: 1000,
              depth: 2
            });
      
            if (incorrectResponses.docs?.length) {
              const incorrectQuestionIds = incorrectResponses.docs.map((r: any) =>
                typeof r.questionId === 'object' ? r.questionId.id : r.questionId
              ).filter(Boolean);
      
              const whereCondition: any = {
                id: { in: incorrectQuestionIds },
                ...(syllabusFilter?.length ? { syllabus: { in: syllabusFilter } } : {})
              };
      
              const incorrectQuestions = await payload.find({
                collection: "mocktestquestions",
                where: whereCondition,
                limit: 1000
              });
      
              if (incorrectQuestions.docs?.length) {
                const randomIndex = Math.floor(Math.random() * incorrectQuestions.docs.length);
                questionToReturn = incorrectQuestions.docs[randomIndex];
              }
            }
          }
      
          // If requesting skipped questions
          else if (skippedOnly && userId) {
            const skippedResponses = await payload.find({
              collection: "userresponses",
              where: {
                and: [
                  { isSkipped: { equals: true } },
                  { userId: { equals: userId } },
                  ...(subjectFilter ? [{ subject: { equals: subjectFilter } }] : [])
                ]
              },
              limit: 1000,
              depth: 2
            });
      
            if (skippedResponses.docs?.length) {
              const skippedQuestionIds = skippedResponses.docs.map((r: any) =>
                typeof r.questionId === 'object' ? r.questionId.id : r.questionId
              ).filter(Boolean);
      
              const whereCondition: any = {
                id: { in: skippedQuestionIds },
                ...(syllabusFilter?.length ? { syllabus: { in: syllabusFilter } } : {})
              };
      
              const skippedQuestions = await payload.find({
                collection: "mocktestquestions",
                where: whereCondition,
                limit: 1000
              });
      
              if (skippedQuestions.docs?.length) {
                const randomIndex = Math.floor(Math.random() * skippedQuestions.docs.length);
                questionToReturn = skippedQuestions.docs[randomIndex];
              }
            }
          }
      
          // Fallback to personalized recommender
          if (!questionToReturn) {
            const whereCondition: any = {
              id: { not_in: attemptedQuestions },
              ...(subjectFilter && { subject: { equals: subjectFilter } }),
              ...(syllabusFilter?.length && { syllabus: { in: syllabusFilter } })
            };
      
            console.log("🔍 Fetching unattempted questions with:", JSON.stringify(whereCondition, null, 2));
      
            const allQuestions = await payload.find({
              collection: "mocktestquestions",
              where: whereCondition,
              limit: 1000
            });
      
            console.log("📦 Found", allQuestions.docs?.length, "unattempted questions");
      
            const userResume = await payload.find({
              collection: "userlearningresume",
              where: { userId: { equals: userId } },
              limit: 1000
            });
      
            console.log("🧠 Found", userResume.docs?.length, "resume entries");
      
            if (!userResume?.docs || !allQuestions?.docs) {
              return Response.json(
                { message: "Resume or questions not found", result: null },
                { status: 500 }
              );
            }
      
            const personalizedPool = recommendQuestionsFromResume(userResume.docs, allQuestions.docs, 30);
            console.log("🎯 Personalized pool size:", personalizedPool.length);
      
           

            // 💡 Fallback to just random from filtered question bank
            if (!personalizedPool.length && allQuestions.docs.length) {
              console.warn("⚠️ No personalized match from resume — falling back to filtered random");
              
              const randomIndex = Math.floor(Math.random() * allQuestions.docs.length);
              questionToReturn = allQuestions.docs[randomIndex];
            
              return Response.json(
                { message: "Fallback question fetched from filtered set", result: questionToReturn },
                {
                  headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                  }
                }
              );
            }
      
            const randomIndex = Math.floor(Math.random() * personalizedPool.length);
            questionToReturn = personalizedPool[randomIndex];
            console.log("✅ Picked question ID:", questionToReturn?.id);
          }
      
          // Final response
          let message = "Next question fetched!";
          if (subjectFilter) message = `Next question fetched for subject: ${subjectFilter}!`;
          if (syllabusFilter?.length) message += " (Filtered by syllabus)";
          if (incorrectOnly) message = "Returning previously incorrect question";
          if (skippedOnly) message = "Returning previously skipped question";
      
          return Response.json(
            { message, result: questionToReturn },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        } catch (error) {
          console.error("❌ Error fetching next question:", error);
          return Response.json(
            { message: `Error fetching question`, error: error },
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
            examCategoryId: "6834529936e55b253c726463", // Using default
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
    
    {
      path: "/bulk-questions",
      method: "get",
      handler: async (req: any) => {
        try {
          const payload = req.payload;
          const subjectFilter = req.query.subject;
          const syllabusFilter = req.query.syllabus ? JSON.parse(req.query.syllabus) : null;
          const attemptedQuestions = req.query.attempted ? JSON.parse(req.query.attempted) : [];
          const userId = req.user?.id || req.query.userId;
    
          if (!userId) {
            return new Response(
              JSON.stringify({ message: "Missing user ID", result: [] }),
              { status: 400 }
            );
          }
    
          const whereCondition: any = {
            id: { not_in: attemptedQuestions },
            ...(subjectFilter && { subject: { equals: subjectFilter } }),
            ...(syllabusFilter?.length && { syllabus: { in: syllabusFilter } }),
          };
    
          console.log("📦 [BULK] Fetching questions with filters:", whereCondition);
    
          const allQuestions = await payload.find({
            collection: "mocktestquestions",
            where: whereCondition,
            limit: 1000,
          });
    
          const shuffled = allQuestions.docs.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 15);
    
          return new Response(
            JSON.stringify({
              message: "Fetched 15 questions",
              result: selected,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        } catch (error) {
          console.error("❌ Error in /bulk-questions:", error);
          return new Response(
            JSON.stringify({ message: "Error fetching bulk questions", error }),
            { status: 500 }
          );
        }
      },
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
                examCategoryId: "6834529936e55b253c726463", // Using default
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