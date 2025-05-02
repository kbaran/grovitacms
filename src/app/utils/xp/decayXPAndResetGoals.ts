export async function decayXPAndResetGoals(userId: string, req: any) {
    const result = await req.payload.find({
      collection: 'users',
      where: { id: { equals: userId } },
    });
  
    const user = result?.docs?.[0];
    if (!user) return;
  
    const now = new Date();
    const lastUpdated = new Date(user.lastXPUpdateAt || now);
    const daysSinceLast = Math.floor((+now - +lastUpdated) / (1000 * 60 * 60 * 24));
  
    const updates: Record<string, any> = {};
  
    if (daysSinceLast > 14 && user.xp > 0) {
      updates.xp = Math.max(user.xp - 25, 0);
    }
  
    const nowWeek = getWeekNumber(now);
    const lastWeek = getWeekNumber(lastUpdated);
    if (nowWeek !== lastWeek) {
      updates.xpEarnedThisWeek = 0;
    }
  
    if (Object.keys(updates).length > 0) {
      updates.lastXPUpdateAt = now.toISOString();
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: updates,
      });
    }
  }
  
  function getWeekNumber(date: Date): number {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = Math.floor((+date - +firstDay) / 86400000);
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  }