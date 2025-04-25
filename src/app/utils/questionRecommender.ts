// utils/questionRecommender.ts

// Type definitions for clarity and safety
export type ResumeTopic = {
  topic: string;
  masteryScore?: number;
};

export type ResumeEntry = {
  topics?: ResumeTopic[];
};

export type Question = {
  id: string;
  topicsCovered?: { topic: string }[];
  difficulty: string;
};

// Main recommender function
export function recommendQuestionsFromResume(
  resumeDocs: ResumeEntry[],
  questionBank: Question[],
  poolSize: number = 30
): Question[] {
  const topicToMastery: Record<string, number> = {};

  // Only use valid resume entries with topics
  for (const resume of resumeDocs) {
    for (const topicObj of resume.topics || []) {
      if (topicObj && topicObj.topic) {
        topicToMastery[topicObj.topic] = topicObj.masteryScore ?? 0;
      }
    }
  }

  const recommendations: Question[] = [];

  for (const [topic, masteryScore] of Object.entries(topicToMastery)) {
    let difficultyFilter: string[];

    if (masteryScore < 70) {
      difficultyFilter = ["easy", "medium"];
    } else if (masteryScore < 90) {
      difficultyFilter = ["medium", "hard"];
    } else {
      difficultyFilter = ["hard"];
    }

    const filtered = questionBank.filter(
      (q) =>
        q.topicsCovered?.some((t) => t.topic === topic) &&
        difficultyFilter.includes(q.difficulty)
    );

    recommendations.push(...filtered.sort(() => 0.5 - Math.random()).slice(0, 3));
  }

  return recommendations.sort(() => 0.5 - Math.random()).slice(0, poolSize);
}
