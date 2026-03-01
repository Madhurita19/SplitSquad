import { validationResult, body } from 'express-validator';

// Middleware to check for validation errors
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation Error',
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

// Auth Validation Rules
export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Must be a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const loginValidation = [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

export const profileValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().trim().isEmail().withMessage('Must be a valid email'),
    body('upiId').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/).withMessage('Invalid UPI ID format'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Group Validation Rules
export const groupValidation = [
    body('name').trim().notEmpty().withMessage('Group name is required').isLength({ max: 50 }).withMessage('Name too long'),
    body('category').optional().isString(),
    body('baseCurrency').optional().isLength({ min: 3, max: 3 })
];

// Expense Validation Rules
export const expenseValidation = [
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 100 }),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('paidBy').notEmpty().withMessage('PaidBy ID is required'),
    body('splitType').isIn(['equal', 'exact', 'percentage', 'shares']).withMessage('Invalid split method')
];

// Settlement Validation Rules
export const settlementValidation = [
    body('payee').notEmpty().withMessage('Payee ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('method').optional().isString()
];
