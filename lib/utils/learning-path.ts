import { db } from '../db';
import { flashcards, learningPaths, userProgress } from '../db/schema/flashcards';
import { eq } from 'drizzle-orm';

interface LearningPathConfig {
  title: string;
  description?: string;
  difficulty: number;
  flashcardIds: number[];
  prerequisites?: number[];
}

export class LearningPathManager {
  async createPath(config: LearningPathConfig) {
    const maxOrderPath = await db.query.learningPaths.findFirst({
      orderBy: (paths, { desc }) => [desc(paths.order)],
    });

    const newOrder = (maxOrderPath?.order || 0) + 1;

    return await db.insert(learningPaths).values({
      ...config,
      order: newOrder,
      flashcardIds: JSON.stringify(config.flashcardIds),
      prerequisites: config.prerequisites ? JSON.stringify(config.prerequisites) : null,
    });
  }

  async getUserProgress(userId: string) {
    return await db.query.userProgress.findMany({
      where: eq(userProgress.userId, userId),
      with: {
        flashcard: true,
        path: true,
      },
    });
  }

  async getNextLesson(userId: string) {
    const progress = await this.getUserProgress(userId);
    const completedPaths = new Set(
      progress
        .filter(p => p.status === 'completed')
        .map(p => p.pathId)
    );

    const availablePaths = await db.query.learningPaths.findMany({
      orderBy: (paths, { asc }) => [asc(paths.order)],
    });

    return availablePaths.find(path => {
      if (completedPaths.has(path.id)) return false;
      
      const prereqs = path.prerequisites ? JSON.parse(path.prerequisites as string) : [];
      return prereqs.every(prereqId => completedPaths.has(prereqId));
    });
  }

  async updateProgress(userId: string, flashcardId: number, pathId: number, correct: boolean) {
    const existingProgress = await db.query.userProgress.findFirst({
      where: (progress, { and }) => and(
        eq(progress.userId, userId),
        eq(progress.flashcardId, flashcardId),
        eq(progress.pathId, pathId)
      ),
    });

    if (existingProgress) {
      return await db.update(userProgress)
        .set({
          correctAttempts: existingProgress.correctAttempts + (correct ? 1 : 0),
          totalAttempts: existingProgress.totalAttempts + 1,
          lastReviewedAt: new Date(),
          status: this.calculateStatus(
            existingProgress.correctAttempts + (correct ? 1 : 0),
            existingProgress.totalAttempts + 1
          ),
        })
        .where(eq(userProgress.id, existingProgress.id));
    }

    return await db.insert(userProgress).values({
      userId,
      flashcardId,
      pathId,
      correctAttempts: correct ? 1 : 0,
      totalAttempts: 1,
      status: 'in_progress',
      lastReviewedAt: new Date(),
    });
  }

  private calculateStatus(correct: number, total: number): 'not_started' | 'in_progress' | 'completed' {
    const ratio = correct / total;
    if (total === 0) return 'not_started';
    if (ratio >= 0.9 && total >= 5) return 'completed';
    return 'in_progress';
  }
}
