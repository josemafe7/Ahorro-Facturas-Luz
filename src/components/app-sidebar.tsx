import Image from "next/image";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { appConfig } from "@/config/app";
import { HOME_PATH } from "@/lib/routes";
import type { SessionUser } from "@/lib/session";

const { brand } = appConfig;

export function BrandLink() {
  return (
    <Link href={HOME_PATH} className="flex items-center gap-3 rounded-md font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <Image src={brand.logo} alt="" width={28} height={28} />
      {brand.name}
    </Link>
  );
}

/** Quién ha iniciado sesión y el botón para salir. Va al pie del menú. */
export function SidebarUser({ user }: { user: SessionUser }) {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
      <div className="px-3">
        <p className="truncate font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground">{user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}

/** El menú lateral fijo de ordenador. En móvil lo sustituye `MobileTopBar`. */
export function AppSidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-sidebar p-4 md:flex">
      <div className="px-1 pt-1">
        <BrandLink />
      </div>
      <div className="flex-1">
        <AppNav />
      </div>
      <SidebarUser user={user} />
    </aside>
  );
}
