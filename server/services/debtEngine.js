import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';

// Calculate raw balances directly from expenses and settlements
export const calculateBalances = async (groupId) => {
    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });

    const balances = {}; // { userId: amount } (positive means owed money, negative means owes money)

    // 1. Process Expenses
    expenses.forEach(expense => {
        // Person who paid gets back the total amount minus their own split
        const paidBy = expense.paidBy.toString();
        if (!balances[paidBy]) balances[paidBy] = 0;
        balances[paidBy] += expense.amount; // They are owed everything they paid

        // Everyone who was split owes their share
        expense.splits.forEach(split => {
            const splitUser = split.user.toString();
            if (!balances[splitUser]) balances[splitUser] = 0;
            balances[splitUser] -= split.amount; // They owe this amount
        });
    });

    // 2. Process Settlements (Debts that were paid back)
    settlements.forEach(settlement => {
        const paidBy = settlement.paidBy.toString();
        const paidTo = settlement.paidTo.toString();

        // The person who paid reduces how much they owe (balance goes up/closer to 0)
        if (!balances[paidBy]) balances[paidBy] = 0;
        balances[paidBy] += settlement.amount;

        // The person who received the money is owed less (balance goes down/closer to 0)
        if (!balances[paidTo]) balances[paidTo] = 0;
        balances[paidTo] -= settlement.amount;
    });

    // Small rounding fixes
    for (let user in balances) {
        balances[user] = Number(balances[user].toFixed(2));
        if (Math.abs(balances[user]) < 0.05) balances[user] = 0; // Eliminate float dust
    }

    return balances;
};

// Greedy min-cash-flow algorithm to simplify debts
export const simplifyDebts = (balances) => {
    const debtors = [];
    const creditors = [];

    // Separate into who owes (debtors) and who is owed (creditors)
    for (const [user, amount] of Object.entries(balances)) {
        if (amount < 0) {
            debtors.push({ user, amount: Math.abs(amount) });
        } else if (amount > 0) {
            creditors.push({ user, amount });
        }
    }

    // Sort by highest amounts first (greedy approach)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let d = 0; // index for debtors
    let c = 0; // index for creditors

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];

        // The amount to settle between these two is the minimum of what the debtor owes and creditor needs
        const settledAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.user,
            to: creditor.user,
            amount: Number(settledAmount.toFixed(2))
        });

        // Update the remaining amounts
        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        // Move to next if fully settled
        if (Math.abs(debtor.amount) < 0.01) d++;
        if (Math.abs(creditor.amount) < 0.01) c++;
    }

    return transactions;
};
