import z from "zod";

export const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    // Add optional user fields to sign-up schema
    firstName: z.string().min(2),
    lastName: z.string().min(2).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

