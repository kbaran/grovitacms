import type { CollectionConfig } from 'payload';

export const MockTestQuestionSets: CollectionConfig = {
  slug: 'mocktestquestionsets',
  admin: {
    useAsTitle: 'mocktestId',
    defaultColumns: ['mocktestId', 'questionCount', 'createdAt'],
    group: 'Mock Tests',
  },
  access: {
    read: ({ req }) => {
      const { role, instituteId } = req.user || {};
      if (role === 'admin') return true;
      if (role === 'accountmanager' && instituteId) {
        return {
          instituteId: {
            equals: typeof instituteId === 'string' ? instituteId : instituteId.id,
          },
        };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'accountmanager',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'accountmanager',
    delete: ({ req }) => req.user?.role === 'admin',
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
    
          const { instituteId, questionGenerationRules } = mocktest;
          const chapterFilters = questionGenerationRules?.chapterFilters || [];
          const topicFilters = questionGenerationRules?.topicFilters || [];
          const difficultyMap = questionGenerationRules?.difficultyDistribution || {};
    
          // 1. Resolve chapterFilters into topic names
          let topicsFromChapters: string[] = [];
    
          if (chapterFilters.length > 0) {
            const chapterIds = chapterFilters.map((c: any) => c.chapter);
            const chapters = await req.payload.find({
              collection: 'examsyllabus',
              where: { id: { in: chapterIds } },
              limit: 100,
            });
    
            topicsFromChapters = chapters.docs
              .map((c: any) => c.topics || [])
              .flat()
              .filter(Boolean);
          }
    
          // 2. Get topics from topicFilters
          const explicitTopicIds = topicFilters.map((t: any) => t.topic).filter(Boolean);
    
          // 3. Merge all topic IDs
          const allTopicIds = Array.from(new Set([...topicsFromChapters, ...explicitTopicIds]));
    
          if (allTopicIds.length === 0) {
            return Response.json({ error: 'No topics selected via chapter or topic filters' }, { status: 400 });
          }
    
          // 4. Normalize selected difficulties
          const selectedDifficulties = Object.entries(difficultyMap)
            .filter(([_, count]) => typeof count === 'number' && count > 0)
            .map(([level]) => {
              if (level === 'easy') return 'Easy';
              if (level === 'medium') return 'Medium';
              if (level === 'hard') return 'Hard';
              if (level === 'very-hard') return 'Very-Hard';
              return level;
            });
    
          // 5. Fetch matching questions
          const allQuestions = await req.payload.find({
            collection: 'mocktestquestions',
            limit: 1000,
            where: {
              topic: { in: allTopicIds },
              difficulty: { in: selectedDifficulties },
            },
          });
    
          // 6. Distribute questions by difficulty
          const selectedQuestions: any[] = [];
    
          for (const [key, count] of Object.entries(difficultyMap)) {
            if ((count as number) > 0) {
              const label =
                key === 'easy' ? 'Easy' :
                key === 'medium' ? 'Medium' :
                key === 'hard' ? 'Hard' :
                key === 'very-hard' ? 'Very-Hard' :
                key;
    
              const questionsForLevel = allQuestions.docs
                .filter((q: any) => q.difficulty === label)
                .slice(0, count as number);
    
              selectedQuestions.push(...questionsForLevel);
            }
          }
    
          const questionsArray = selectedQuestions.map((q: any, index: number) => ({
            questionId: q.id,
            order: index + 1,
            marks: 4,
            negativeMarks: -1,
          }));
    
          // 7. Create the question set
          const createdSet = await req.payload.create({
            collection: 'mocktestquestionsets',
            data: {
              mocktestId,
              instituteId,
              questions: questionsArray,
            },
          });
    
          return Response.json({ success: true, questionSetId: createdSet.id }, { status: 200 });
        } catch (err) {
          console.error('Error generating mocktest question set:', err);
          return Response.json({ error: 'Server Error' }, { status: 500 });
        }
      },
    },
  ],
};