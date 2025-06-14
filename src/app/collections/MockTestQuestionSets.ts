import type { CollectionConfig } from 'payload';

export const MockTestQuestionSets: CollectionConfig = {
  slug: 'mocktestquestionsets',
  admin: {
    useAsTitle: 'mocktestId',
    defaultColumns: ['mocktestId', 'questionCount', 'createdAt'],
    group: 'Mock Tests',
  },
  auth: {
    useAPIKey: true, // Enable API key-based access
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
  
          console.log("🟡 mocktestId received:", mocktestId);
  
          if (!mocktestId) {
            return Response.json({ error: 'mocktestId is required' }, { status: 400 });
          }
  
          const mocktest = await req.payload.findByID({
            collection: 'mocktests',
            id: mocktestId,
          });
  
          if (!mocktest) {
            return Response.json({ error: 'Mocktest not found' }, { status: 404 });
          }
  
          console.log("✅ Mocktest found:", mocktest.title);
  
          const { instituteId, questionGenerationRules } = mocktest;
          const chapterFilters = questionGenerationRules?.syllabusFilters || [];
          const difficultyMap = questionGenerationRules?.difficultyDistribution || {};
          const topicFilters = questionGenerationRules?.topicFilters || [];
  
          console.log("🧩 chapterFilters:", chapterFilters);
          console.log("🧩 topicFilters:", topicFilters);
          console.log("🧩 difficultyMap:", difficultyMap);
  
          // 1. Resolve chapter topics
          const chapterIds = chapterFilters
            .map((c: any) => (typeof c.chapter === 'object' ? c.chapter.id : c.chapter))
            .filter((id: any) => typeof id === 'string' && id.length === 24);
  
          console.log("🔍 Resolved chapterIds:", chapterIds);
  
          let chapters: any = { docs: [] };
          if (chapterIds.length > 0) {
            chapters = await req.payload.find({
              collection: 'examsyllabus',
              where: { id: { in: chapterIds } },
              limit: 100,
            });
          }
  
          console.log("📘 Fetched chapters:", chapters.docs.length);
  
          const topicsFromChapters = chapters.docs
            .flatMap((c: any) =>
              Array.isArray(c.topicsCovered)
                ? c.topicsCovered.map((t: any) =>
                    typeof t === 'object' ? t.id || t.value : t
                  )
                : []
            )
            .filter(Boolean);
  
          console.log("📚 Extracted topics from chapters:", topicsFromChapters);
  
          // 2. Add explicit topic filters
          const explicitTopicIds = topicFilters
            .map((t: any) => (typeof t.topic === 'object' ? t.topic.id : t.topic))
            .filter(Boolean);
  
          console.log("📚 Extracted topics from topicFilters:", explicitTopicIds);
  
          const allTopicIds = Array.from(new Set([...topicsFromChapters, ...explicitTopicIds]));
  
          console.log("✅ Merged topic IDs for filtering:", allTopicIds);
  
          if (allTopicIds.length === 0) {
            return Response.json({ error: 'No topics found from selected filters' }, { status: 400 });
          }
  
          // 3. Resolve difficulty levels
          const selectedDifficulties = Object.entries(difficultyMap)
            .filter(([_, count]) => typeof count === 'number' && count > 0)
            .map(([level]) => level.toLowerCase());
  
          console.log("🎯 Selected difficulties:", selectedDifficulties);
  
          // 4. Get raw questions
          const allRawQuestions = await req.payload.find({
            collection: 'mocktestquestions',
            limit: 1000,
            where: {
              difficulty: { in: selectedDifficulties },
            },
          });
  
          console.log("🔍 Raw questions fetched:", allRawQuestions.docs.length);
  
          // 5. Manual filter using topicsCovered
          const filteredQuestions = allRawQuestions.docs.filter((q: any) => {
            const qTopics = Array.isArray(q.topicsCovered) ? q.topicsCovered : [];
            return qTopics.some((t: any) =>
              allTopicIds.includes(typeof t === 'object' ? t.id || t.value : t)
            );
          });
  
          console.log("✅ Filtered by topicsCovered:", filteredQuestions.length);
  
          // 6. Slice questions per difficulty
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
  
          console.log("🧮 Total questions to add:", questionsArray.length);
          console.log("📋 Sample question object:", questionsArray[0]);
  
          if (questionsArray.length === 0) {
            return Response.json({ error: 'No matching questions found' }, { status: 400 });
          }
  
          const createdSet = await req.payload.create({
            collection: 'mocktestquestionsets',
            data: {
              mocktestId,
              instituteId: typeof instituteId === 'object' ? instituteId.id : instituteId,
              questions: questionsArray,
            },
          });
  
          console.log("✅ Created questionSet with ID:", createdSet.id);
  
          return Response.json({ success: true, questionSetId: createdSet.id }, { status: 200 });
        } catch (err) {
          console.error('❌ Error generating mocktest question set:', err);
          return Response.json({ error: 'Server Error' }, { status: 500 });
        }
      },
    },
  ],
};