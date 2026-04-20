"use server";

import { redirect } from "next/navigation";
import { signInWithPassword, signOut } from "@/lib/hr/session";

export async function loginAction(formData: FormData): Promise<void> {
  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");
  const result = await signInWithPassword({ email, password });

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.message)}`);
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  return value.trim();
}
