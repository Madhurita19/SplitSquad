import cron from 'node-cron';
import Expense from '../models/Expense.js';

// Helper to calculate the next date based on the interval
const calculateNextDate = (currentDate, interval) => {
    const nextDate = new Date(currentDate);
    switch (interval) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        default:
            return null;
    }
    return nextDate;
};

export const initExpenseCron = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Starting recurring expense processor...');
        try {
            const now = new Date();

            // Find all expenses that are recurring and their nextDate has passed
            // Only find expenses that have the interval field set (meaning they are currently active)
            const dueExpenses = await Expense.find({
                'recurrence.nextDate': { $lte: now },
                'recurrence.interval': { $exists: true, $ne: null }
            });

            let processed = 0;

            for (const oldExpense of dueExpenses) {
                const interval = oldExpense.recurrence.interval;
                const oldNextDate = oldExpense.recurrence.nextDate;

                // 1. Calculate the new nextDate based on the interval
                const nextNextDate = calculateNextDate(oldNextDate, interval);

                // 2. Clone the expense details for the NEW expense
                const newExpenseData = {
                    group: oldExpense.group,
                    description: oldExpense.description,
                    amount: oldExpense.amount,
                    paidBy: oldExpense.paidBy,
                    splitType: oldExpense.splitType,
                    category: oldExpense.category,
                    note: oldExpense.note ? `${oldExpense.note} (Auto-generated)` : '(Auto-generated recurring expense)',
                    // The new expense date should ideally be the date it was *supposed* to run
                    date: oldNextDate,
                    splits: oldExpense.splits.map(s => ({ user: s.user, amount: s.amount })),
                    // Pass the baton: Attach the recurrence object to the NEW expense
                    recurrence: {
                        interval,
                        nextDate: nextNextDate
                    }
                };

                const newExpense = new Expense(newExpenseData);
                await newExpense.save();

                // 3. Remove recurrence from the OLD expense so it doesn't run again
                oldExpense.recurrence = undefined;
                await oldExpense.save();

                processed++;
            }

            console.log(`[CRON] Recurring expense processor finished. Created ${processed} new expenses.`);
        } catch (error) {
            console.error('[CRON] Error processing recurring expenses:', error);
        }
    });

    console.log('Recurring expenses cron job initialized.');
};
