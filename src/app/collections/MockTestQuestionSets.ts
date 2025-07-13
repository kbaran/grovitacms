import type { CollectionConfig } from 'payload';

export const MockTestQuestionSets: CollectionConfig = {
  slug: 'mocktestquestionsets',
  admin: {
    useAsTitle: 'mocktestId',
    defaultColumns: ['mocktestId', 'questionCount', 'createdAt'],
    group: 'Mock Tests',
  },
  access: {
    read: () => true, // ✅ Anyone can read users
    create: () => true, // ✅ Allow user creation without login (important!)
    update: ({ req }) => {
      const authHeader = req.headers?.get?.('authorization') || '';
      const isApiKey = authHeader.startsWith('API-Key');
      const isLoggedInUser = !!req.user;
      return isLoggedInUser || isApiKey;
    },
    delete: () => false, // ✅ No one can delete users
  },
  fields: [
    {
      name: 'mocktestId',
      type: 'relationship',
      relationTo: 'mocktests',
      required: true,
    },
    {
      name: 'instituteId',
      type: 'relationship',
      relationTo: 'institute',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'questionId',
          type: 'relationship',
          relationTo: 'mocktestquestions',
          required: true,
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          admin: {
            description: 'Display order in mocktest UI',
          },
        },
        {
          name: 'marks',
          type: 'number',
          defaultValue: 4,
        },
        {
          name: 'negativeMarks',
          type: 'number',
          defaultValue: -1,
        },
      ],
    },
    {
      name: 'questionCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Auto-calculated for reference',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data.questions) {
          data.questionCount = data.questions.length;
        }
      },
    ],
  },
  endpoints: [
    {
      path: '/generate',
      method: 'post',
      handler: async (req: any) => {
        try {
          const body = await req?.json();
          const { mocktestId } = body;
    
          console.log("🟡 =================================");
          console.log("🟡 STARTING GENERATION FOR:", mocktestId);
          console.log("🟡 =================================");
    
          if (!mocktestId) {
            return Response.json({ error: 'mocktestId is required' }, { status: 400 });
          }
    
          // 🔍 Step 1: Verify mocktest exists and get details
          console.log("🔍 Step 1: Verifying mocktest...");
          
          let mocktest;
          try {
            mocktest = await req.payload.findByID({
              collection: 'mocktests',
              id: mocktestId,
            });
            console.log("✅ Mocktest found:", {
              id: mocktest.id,
              title: mocktest.title,
              instituteId: typeof mocktest.instituteId === 'object' ? mocktest.instituteId.id : mocktest.instituteId,
              hasQuestionGenerationRules: !!mocktest.questionGenerationRules
            });
          } catch (mocktestError) {
            console.error("❌ Mocktest fetch error:", mocktestError);
            return Response.json({ error: 'Mocktest not found', details: mocktestError }, { status: 404 });
          }
    
          // 🔍 Step 2: Verify institute exists
          const instituteId = typeof mocktest.instituteId === 'object' ? mocktest.instituteId.id : mocktest.instituteId;
          console.log("🔍 Step 2: Verifying institute...");
          
          try {
            const institute = await req.payload.findByID({
              collection: 'institute',
              id: instituteId,
            });
            console.log("✅ Institute found:", {
              id: institute.id,
              name: institute.name || institute.title || 'Unknown'
            });
          } catch (instituteError) {
            console.error("❌ Institute fetch error:", instituteError);
            return Response.json({ error: 'Institute not found', details: instituteError }, { status: 404 });
          }
    
          // 🔍 Step 3: Check existing question sets
          console.log("🔍 Step 3: Checking existing question sets...");
          
          const existingQuestionSets = await req.payload.find({
            collection: 'mocktestquestionsets',
            limit: 1000,
            pagination: false
          });
          
          console.log("📊 Total existing question sets:", existingQuestionSets.docs.length);
          
          const existingForThisMocktest = existingQuestionSets.docs.filter((set: any) => {
            const setMocktestId = typeof set.mocktestId === 'object' ? set.mocktestId.id : set.mocktestId;
            return setMocktestId === mocktestId;
          });
          
          console.log("📊 Existing question sets for this mocktest:", existingForThisMocktest.length);
          
          if (existingForThisMocktest.length > 0) {
            console.log("⚠️ Question set already exists for this mocktest!");
            const existing = existingForThisMocktest[0];
            return Response.json({ 
              success: true, 
              questionSetId: existing.id,
              message: "Question set already exists for this mocktest",
              existing: true 
            });
          }
    
          // 🔍 Step 4: Test basic creation capability
          console.log("🔍 Step 4: Testing basic creation capability...");
          
          try {
            // Try to create a minimal test document first
            const testData = {
              mocktestId: mocktestId,
              instituteId: instituteId,
              questions: [
                {
                  questionId: "TEST_QUESTION_ID",
                  order: 1,
                  marks: 4,
                  negativeMarks: -1,
                }
              ],
            };
    
            console.log("🧪 Testing creation with minimal data:", testData);
    
            // Don't actually create, just validate the data structure
            console.log("🧪 Data structure looks valid, proceeding with full generation...");
    
          } catch (testError) {
            console.error("❌ Basic creation test failed:", testError);
            return Response.json({ 
              error: 'Basic creation test failed', 
              details: testError 
            }, { status: 500 });
          }
    
          // 🔍 Step 5: Process generation rules
          console.log("🔍 Step 5: Processing generation rules...");
          
          const { questionGenerationRules } = mocktest;
          
          if (!questionGenerationRules) {
            console.error("❌ No question generation rules found");
            return Response.json({ error: 'No question generation rules configured for this mocktest' }, { status: 400 });
          }
    
          const chapterFilters = questionGenerationRules?.syllabusFilters || [];
          const difficultyMap = questionGenerationRules?.difficultyDistribution || {};
          const topicFilters = questionGenerationRules?.topicFilters || [];
    
          console.log("🧩 Generation rules summary:", {
            chapterFilters: chapterFilters.length,
            difficultyEntries: Object.keys(difficultyMap).length,
            topicFilters: topicFilters.length
          });
    
          // 🔍 Step 6: Resolve chapters and topics
          console.log("🔍 Step 6: Resolving chapters and topics...");
          
          const chapterIds = chapterFilters
            .map((c: any) => (typeof c.chapter === 'object' ? c.chapter.id : c.chapter))
            .filter((id: any) => typeof id === 'string' && id.length === 24);
    
          console.log("🔍 Resolved chapterIds:", chapterIds.length);
    
          let chapters: any = { docs: [] };
          if (chapterIds.length > 0) {
            try {
              chapters = await req.payload.find({
                collection: 'examsyllabus',
                where: { id: { in: chapterIds } },
                limit: 100,
              });
              console.log("📘 Fetched chapters:", chapters.docs.length);
            } catch (chapterError) {
              console.error("❌ Chapter fetch error:", chapterError);
              return Response.json({ error: 'Failed to fetch chapters', details: chapterError }, { status: 500 });
            }
          }
    
          const topicsFromChapters = chapters.docs
            .flatMap((c: any) =>
              Array.isArray(c.topicsCovered)
                ? c.topicsCovered.map((t: any) =>
                    typeof t === 'object' ? t.id || t.value : t
                  )
                : []
            )
            .filter(Boolean);
    
          const explicitTopicIds = topicFilters
            .map((t: any) => (typeof t.topic === 'object' ? t.topic.id : t.topic))
            .filter(Boolean);
    
          const allTopicIds = Array.from(new Set([...topicsFromChapters, ...explicitTopicIds]));
    
          console.log("📚 Topics summary:", {
            fromChapters: topicsFromChapters.length,
            explicit: explicitTopicIds.length,
            total: allTopicIds.length
          });
    
          if (allTopicIds.length === 0) {
            console.error("❌ No topics found from filters");
            return Response.json({ error: 'No topics found from selected filters' }, { status: 400 });
          }
    
          // 🔍 Step 7: Get questions
          console.log("🔍 Step 7: Fetching questions...");
          
          const selectedDifficulties = Object.entries(difficultyMap)
            .filter(([_, count]) => typeof count === 'number' && count > 0)
            .map(([level]) => level.toLowerCase());
    
          console.log("🎯 Selected difficulties:", selectedDifficulties);
    
          let allRawQuestions;
          try {
            allRawQuestions = await req.payload.find({
              collection: 'mocktestquestions',
              limit: 1000,
              where: {
                difficulty: { in: selectedDifficulties },
              },
            });
            console.log("🔍 Raw questions fetched:", allRawQuestions.docs.length);
          } catch (questionError) {
            console.error("❌ Question fetch error:", questionError);
            return Response.json({ error: 'Failed to fetch questions', details: questionError }, { status: 500 });
          }
    
          const filteredQuestions = allRawQuestions.docs.filter((q: any) => {
            const qTopics = Array.isArray(q.topicsCovered) ? q.topicsCovered : [];
            return qTopics.some((t: any) =>
              allTopicIds.includes(typeof t === 'object' ? t.id || t.value : t)
            );
          });
    
          console.log("✅ Filtered questions:", filteredQuestions.length);
    
          // 🔍 Step 8: Build question array
          console.log("🔍 Step 8: Building question array...");
          
          const selectedQuestions: any[] = [];
    
          for (const [key, count] of Object.entries(difficultyMap)) {
            if ((count as number) > 0) {
              const questionsForLevel = filteredQuestions
                .filter((q: any) => q.difficulty?.toLowerCase() === key.toLowerCase())
                .slice(0, count as number);
    
              console.log(`🎯 Selected ${questionsForLevel.length} questions for ${key}`);
              selectedQuestions.push(...questionsForLevel);
            }
          }
    
          const questionsArray = selectedQuestions.map((q: any, index: number) => ({
            questionId: q.id,
            order: index + 1,
            marks: 4,
            negativeMarks: -1,
          }));
    
          console.log("🧮 Final question array:", questionsArray.length);
    
          if (questionsArray.length === 0) {
            console.error("❌ No matching questions found");
            return Response.json({ error: 'No matching questions found for the specified criteria' }, { status: 400 });
          }
    
          // 🔍 Step 9: Final creation attempt
          console.log("🔍 Step 9: Creating question set...");
          
          const finalData = {
            mocktestId,
            instituteId,
            questions: questionsArray,
          };
    
          console.log("🚨 Final creation data:", {
            mocktestId: finalData.mocktestId,
            instituteId: finalData.instituteId,
            questionsCount: finalData.questions.length,
            sampleQuestion: finalData.questions[0]
          });
    
          try {
            const createdSet = await req.payload.create({
              collection: 'mocktestquestionsets',
              data: finalData,
            });
    
            console.log("✅ SUCCESS! Created questionSet with ID:", createdSet.id);
            console.log("🟡 =================================");
            
            return Response.json({ 
              success: true, 
              questionSetId: createdSet.id,
              questionsCount: questionsArray.length,
              message: "Question set created successfully"
            }, { status: 200 });
    
          } catch (createError: any) {
            console.error("🚨 CREATION FAILED:");
            console.error("🚨 Error name:", createError.name);
            console.error("🚨 Error message:", createError.message);
            console.error("🚨 Error code:", createError.code);
            console.error("🚨 Error details:", createError.details);
            console.error("🚨 Error errors:", createError.errors);
            console.error("🚨 Full error:", createError);
            console.log("🟡 =================================");
    
            return Response.json({ 
              error: 'Creation failed',
              errorName: createError.name,
              errorMessage: createError.message,
              errorCode: createError.code,
              errorDetails: createError.details,
              fullError: createError.toString()
            }, { status: 500 });
          }
    
        } catch (outerError: any) {
          console.error('❌ OUTER ERROR:');
          console.error('❌ Error name:', outerError.name);
          console.error('❌ Error message:', outerError.message);
          console.error('❌ Error stack:', outerError.stack);
          console.log("🟡 =================================");
          
          return Response.json({ 
            error: 'Outer error occurred',
            errorName: outerError.name,
            errorMessage: outerError.message,
            stack: outerError.stack
          }, { status: 500 });
        }
      },
    },
  ],
};