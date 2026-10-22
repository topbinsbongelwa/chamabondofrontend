import { z } from 'zod'

export const DEPARTMENTS = [
  'ECD A',
  'ECD B',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Sports',
  'Administration',
] as const

export type Department = (typeof DEPARTMENTS)[number]

/** EC numbers are shown in upper case without spaces on the payroll system. */
export function normalizeEcNumber(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Keeps digits (and a leading +) so the Zimbabwe number format can be checked. */
export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

const name = (label: string, max = 60) =>
  z
    .string()
    .min(1, `Enter your ${label}`)
    .max(max, `Your ${label} is too long`)
    .refine((value) => value.trim().length > 0, `Enter your ${label}`)

export const signupSchema = z
  .object({
    firstName: name('first name', 50),
    surname: name('surname', 50),
    ecNumber: z
      .string()
      .min(1, 'Enter your EC number')
      .max(20, 'EC number is too long')
      .regex(/^[A-Z0-9]+$/, 'Use letters and numbers only, for example EC12345')
      .refine((value) => value.length >= 3, 'Enter at least 3 letters or numbers'),
    phone: z
      .string()
      .min(1, 'Enter your phone number')
      .regex(/^(?:\+?263|0)?7\d{8}$/, 'Enter a valid number, for example 0771234567'),
    department: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupValues = z.infer<typeof signupSchema>
