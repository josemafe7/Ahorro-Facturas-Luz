import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { appConfig } from "@/config/app";
import { HOME_PATH } from "@/lib/routes";
import { getSessionUser } from "@/lib/session";

import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect(HOME_PATH);

  const { brand } = appConfig;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src={brand.logo} alt="" width={48} height={48} priority />
          <div>
            <h1 className="text-xl font-semibold">{brand.name}</h1>
            <p className="mt-1 text-muted-foreground">{brand.tagline}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
