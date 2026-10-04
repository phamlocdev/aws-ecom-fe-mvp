import { z } from 'zod'

const optionalUrl = z
  .union([z.string().trim().url('Image URL must be a valid URL').max(2048), z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value))

const optionalDescription = z
  .union([z.string().trim().min(1, 'Description cannot be empty').max(500), z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value))

export const productStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const productImageSchema = z.object({
  key: z.string().trim().min(1).max(1024),
  sortOrder: z.coerce.number().int().min(0),
  isPrimary: z.boolean(),
  altText: z
    .union([z.string().trim().max(160), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
})

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  categoryId: z.string().trim().min(1, 'Category is required').max(64),
  price: z.coerce.number().int('Price must be an integer VND amount').min(1),
  availableQuantity: z.coerce.number().int('Quantity must be an integer').min(0).default(0),
  imageUrl: optionalUrl,
  images: z.array(productImageSchema).optional(),
  status: productStatusSchema.default('ACTIVE'),
})

export const userProfileFormSchema = z.object({
  name: z
    .union([z.string().trim().max(120), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  address: z
    .object({
      recipientName: z
        .union([z.string().trim().max(120), z.literal('')])
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
      phone: z
        .union([z.string().trim().max(40), z.literal('')])
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
      line1: z
        .union([z.string().trim().max(240), z.literal('')])
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
      location: z
        .object({
          ward: z
            .union([z.string().trim().max(120), z.literal('')])
            .optional()
            .transform((value) => (value === '' ? undefined : value)),
          district: z
            .union([z.string().trim().max(120), z.literal('')])
            .optional()
            .transform((value) => (value === '' ? undefined : value)),
          city: z
            .union([z.string().trim().max(120), z.literal('')])
            .optional()
            .transform((value) => (value === '' ? undefined : value)),
        })
        .optional(),
      notes: z
        .union([z.string().trim().max(500), z.literal('')])
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
    })
    .optional(),
})

export const categoryCreateSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase slug format, e.g. electronics or home-decor',
    )
    .max(64),
  name: z.string().trim().min(2).max(80),
  description: optionalDescription,
})

export const categoryUpdateSchema = categoryCreateSchema.omit({ categoryId: true })

export const inventoryAdjustmentSchema = z.object({
  availableQuantity: z.coerce.number().int('Quantity must be an integer').min(0),
})

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(64, 'Username must be at most 64 characters')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, underscores, or hyphens')
  .refine((value) => !value.includes('@'), 'Username cannot be an email address')

const cognitoPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')

export const setSignInPasswordSchema = z
  .object({
    password: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  })

export const signInSchema = z.object({
  username: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: z.string().trim().email('Email must be valid').max(254),
    password: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const confirmSignUpSchema = z.object({
  username: z.string().trim().min(1, 'Email or username is required'),
  confirmationCode: z.string().trim().min(1, 'Confirmation code is required'),
})

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, 'Email or username is required'),
})

export const confirmForgotPasswordSchema = z
  .object({
    confirmationCode: z.string().trim().min(1, 'Reset code is required'),
    newPassword: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>
export type ProductImageValues = z.output<typeof productImageSchema>
export type UserProfileFormInput = z.input<typeof userProfileFormSchema>
export type UserProfileFormValues = z.output<typeof userProfileFormSchema>
export type SetSignInPasswordInput = z.input<typeof setSignInPasswordSchema>
export type SetSignInPasswordValues = z.output<typeof setSignInPasswordSchema>
export type ChangePasswordInput = z.input<typeof changePasswordSchema>
export type ChangePasswordValues = z.output<typeof changePasswordSchema>
export type CategoryCreateInput = z.input<typeof categoryCreateSchema>
export type CategoryCreateValues = z.output<typeof categoryCreateSchema>
export type CategoryUpdateValues = z.output<typeof categoryUpdateSchema>
export type InventoryAdjustmentInput = z.input<typeof inventoryAdjustmentSchema>
export type InventoryAdjustmentValues = z.output<typeof inventoryAdjustmentSchema>
export type SignInValues = z.output<typeof signInSchema>
export type SignUpInput = z.input<typeof signUpSchema>
export type SignUpValues = z.output<typeof signUpSchema>
export type ConfirmSignUpValues = z.output<typeof confirmSignUpSchema>
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>
export type ConfirmForgotPasswordValues = z.output<typeof confirmForgotPasswordSchema>
