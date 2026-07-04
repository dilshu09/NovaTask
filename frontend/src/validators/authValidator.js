import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});


export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSendOtpSchema = z.object({
  email: z.string().email('Please provide a valid email'),
});

export const loginVerifyOtpSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

