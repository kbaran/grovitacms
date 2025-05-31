import { differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears } from 'date-fns';

export async function resetUserLimitsIfNeeded({ userId, payload }) {
    const user = await payload.findByID({ collection: 'users', id: userId });
    const now = new Date();

    let updates = {};

    if (!user.lastAiTutorResetDate || differenceInCalendarDays(now, new Date(user.lastAiTutorResetDate)) >= 1) {
        updates.aiTutorHitsToday = 0;
        updates.lastAiTutorResetDate = now;
    }

    if (!user.lastExamAssistResetDate || differenceInCalendarMonths(now, new Date(user.lastExamAssistResetDate)) >= 1) {
        updates.examAssistHitsThisMonth = 0;
        updates.lastExamAssistResetDate = now;
    }

    if (!user.lastMockTestResetDate || differenceInCalendarYears(now, new Date(user.lastMockTestResetDate)) >= 1) {
        updates.mockTestsThisYear = 0;
        updates.lastMockTestResetDate = now;
    }

    if (Object.keys(updates).length > 0) {
        const updatedUser = await payload.update({
            collection: 'users',
            id: userId,
            data: updates,
        });
        console.log(`✅ User ${userId} counters reset:`, updates);
        return updatedUser;
    } else {
        console.log(`✅ No reset needed for user ${userId}`);
        return user;
    }
}