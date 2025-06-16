import { isAdminOrManager } from '@/access/isAdminOrManager';
import type { CollectionConfig } from 'payload';

export const UserLearningResume: CollectionConfig = {
  slug: 'userlearningresume',
  access: {
    read: ({ req }: any) => {
      if (!req.user) return false;
      const { role, id } = req.user;
      if (role === 'admin' || role === 'accountmanager') return true;
      return { userId: { equals: id } };
    },
    create: () => true,
    update: ({ req }) =>
  req.user?.collection === 'users' &&
  (req.user.role === 'admin' || req.user.role === 'accountmanager'),
    delete: ({ req }) =>
  req.user?.collection === 'users' && req.user.role === 'admin',
  },
  admin: {
    useAsTitle: 'userId',
  },
  fields: [
    { name: 'userId', type: 'text', required: true, label: 'User ID', admin: { position: 'sidebar', readOnly: true } },
    { name: 'subject', type: 'text', required: true, label: 'Subject' },
    { name: 'chapter', type: 'text', required: true, label: 'Chapter (Syllabus)' },
    { name: 'chapterWeightage', type: 'number', label: 'Chapter Weightage (%)', required: false },
    {
      name: 'topics', type: 'array', label: 'Topic Stats', fields: [
        { name: 'topic', type: 'text', required: true },
        { name: 'masteryScore', type: 'number', required: true },
        { name: 'accuracy', type: 'number' },
        { name: 'avgTime', type: 'number' },
        { name: 'attempts', type: 'number' },
      ]
    },
    { name: 'totalQuestions', type: 'number', defaultValue: 0 },
    { name: 'skippedCount', type: 'number', defaultValue: 0 },
    { name: 'incorrectCount', type: 'number', defaultValue: 0 },
    { name: 'masteryScore', type: 'number', label: 'Overall Mastery Score' },
    { name: 'AIRecommendationScore', type: 'number', label: 'AI Recommendation Score' },
    { name: 'tags', type: 'array', label: 'Tags', fields: [{ name: 'tag', type: 'text' }] },
    { name: 'lastActivityDate', type: 'date', label: 'Last Activity Date' },
  ],
  endpoints: [
    {
      path: '/:update-resume',
      method: 'post',
      handler: async (req: any) => {
        try {
          const body = await req.json();
          const userId = body.userId || req.user?.id;
          const payload = req.payload;

          console.log("🔐 Authenticated user:", req.user);
          console.log("Payload userId:", userId);

          if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized. User ID missing.' }), { status: 401 });
          }

          const allResponses = await payload.find({
            collection: 'userresponses',
            where: { userId: { equals: userId } },
            limit: 10000,
            pagination: false,
          });

          console.log("📥 Found", allResponses.docs.length, "user responses for:", userId);

          const grouped: any = {};

          for (const response of allResponses.docs) {
            const { subject, topics, isCorrect, isSkipped, timeSpent, difficulty } = response;
            const chapter = response.syllabus || response.chapter || 'Unknown';
            const topicList = (topics || '').split(',').map((t: string) => t.trim()).filter(Boolean);

            if (!grouped[subject]) grouped[subject] = {};
            if (!grouped[subject][chapter]) grouped[subject][chapter] = {};

            for (const topic of topicList) {
              if (!grouped[subject][chapter][topic]) {
                grouped[subject][chapter][topic] = {
                  correct: 0, total: 0, totalTime: 0, difficulty: [], skipped: 0,
                };
              }
              const entry = grouped[subject][chapter][topic];
              entry.total++;
              if (isCorrect) entry.correct++;
              if (isSkipped) entry.skipped++;
              entry.totalTime += timeSpent || 0;
              if (difficulty) entry.difficulty.push(difficulty);
            }
          }

          console.log("🧠 Grouped structure:", JSON.stringify(grouped, null, 2));

          const updatedChapters = [];

          for (const subject of Object.keys(grouped)) {
            for (const chapter of Object.keys(grouped[subject])) {
              const topics = grouped[subject][chapter];
              const topicStats = [];

              let totalCorrect = 0;
              let totalAttempts = 0;
              let totalTime = 0;
              let totalSkipped = 0;

              for (const topic of Object.keys(topics)) {
                const data = topics[topic];
                const accuracy = data.correct / data.total;
                const avgTime = data.totalTime / data.total;
                const masteryScore = Math.round((accuracy * 60 + (1 - avgTime / 120) * 20));

                topicStats.push({
                  topic,
                  masteryScore,
                  accuracy: Math.round(accuracy * 100),
                  avgTime: Math.round(avgTime),
                  attempts: data.total,
                });

                totalCorrect += data.correct;
                totalAttempts += data.total;
                totalTime += data.totalTime;
                totalSkipped += data.skipped;
              }

              const overallMastery = topicStats.reduce((sum, t: any) => sum + t.masteryScore, 0) / topicStats.length;

              const syllabusData = await payload.find({
                collection: 'examsyllabus',
                where: {
                  and: [
                    { subject: { equals: subject } },
                    { syllabus: { equals: chapter } },
                  ],
                },
                limit: 1,
              });

              const chapterWeightage = syllabusData?.docs?.[0]?.weightage || 1;
              const recommendationScore = Math.round((100 - overallMastery) * chapterWeightage);

              console.log("📌 Preparing resume update for Subject:", subject, "Chapter:", chapter);
              console.log("📊 Topics:", topicStats);

              const result = await payload.update({
                collection: 'userlearningresume',
                where: {
                  and: [
                    { userId: { equals: userId } },
                    { chapter: { equals: chapter } },
                  ],
                },
                data: {
                  userId,
                  subject,
                  chapter,
                  chapterWeightage,
                  topics: topicStats,
                  totalQuestions: totalAttempts,
                  skippedCount: totalSkipped,
                  incorrectCount: totalAttempts - totalCorrect,
                  masteryScore: Math.round(overallMastery),
                  AIRecommendationScore: recommendationScore,
                  lastActivityDate: new Date(),
                },
                upsert: true,
              });

              if (!result?.docs?.length) {
                const created = await payload.create({
                  collection: 'userlearningresume',
                  data: {
                    userId,
                    subject,
                    chapter,
                    chapterWeightage,
                    topics: topicStats,
                    totalQuestions: totalAttempts,
                    skippedCount: totalSkipped,
                    incorrectCount: totalAttempts - totalCorrect,
                    masteryScore: Math.round(overallMastery),
                    AIRecommendationScore: recommendationScore,
                    lastActivityDate: new Date(),
                  },
                });
                console.log("✅ Resume created manually:", created.id);
              } else {
                console.log("✅ Resume record updated or inserted:", result);
              }

              updatedChapters.push({ subject, chapter });
            }
          }

          return new Response(
            JSON.stringify({ message: 'User resume updated successfully!', updated: updatedChapters }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        } catch (error) {
          console.error('Error updating resume:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update user resume', details: error }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      },
    },
  ],
};

export default UserLearningResume;
