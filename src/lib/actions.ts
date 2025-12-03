"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(formData: any) {
  try {
    await signIn("credentials", { ...formData, redirect: false });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}
