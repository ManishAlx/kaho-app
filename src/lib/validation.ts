import { z } from 'zod';
import { MAX_MESSAGE_LENGTH, MAX_REPLY_LENGTH, RESERVED_USERNAMES } from './config';

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 characters: letters, numbers or underscore')
  .refine((u) => !RESERVED_USERNAMES.has(u), 'That username is reserved');

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  username: usernameSchema,
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: 'You must confirm you are 13 or older' }) }),
});

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(2, 'Username or email required').max(254).optional(),
    email: z.string().trim().min(2, 'Username or email required').max(254).optional(),
    password: z.string().min(1, 'Password required').max(100),
  })
  .refine((v) => !!v.identifier || !!v.email, {
    message: 'Username or email required',
  });

export const sendMessageSchema = z.object({
  username: usernameSchema,
  body: z.string().trim().min(1, 'Write something first').max(MAX_MESSAGE_LENGTH, `Max ${MAX_MESSAGE_LENGTH} characters`),
  gameMode: z.string().optional().default('ama'),
});

export const patchMessageSchema = z
  .object({
    isRead: z.boolean().optional(),
    reply: z.string().trim().min(1).max(MAX_REPLY_LENGTH).optional(),
  })
  .refine((v) => v.isRead !== undefined || v.reply !== undefined, 'Nothing to update');

export const patchMeSchema = z
  .object({
    displayName: z.string().trim().min(1).max(40).optional(),
    acceptingMessages: z.boolean().optional(),
    blockedWords: z.string().max(500).optional(),
  })
  .refine(
    (v) => v.displayName !== undefined || v.acceptingMessages !== undefined || v.blockedWords !== undefined,
    'Nothing to update'
  );

export const deleteMeSchema = z.object({ password: z.string().min(1).max(100) });

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? 'Invalid input';
