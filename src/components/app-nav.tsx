"use client";

import { FileTextIcon, SettingsIcon, TagsIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appConfig } from "@/config/app";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const { texts } = appConfig.sector;

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: routes.studies, label: texts.study.plural, icon: FileTextIcon },
  { href: routes.catalog, label: "Catálogo", icon: TagsIcon },
  { href: routes.settings, label: "Ajustes", icon: SettingsIcon },
];

/** Las secciones de la app. Sirve para el menú lateral y para el menú del móvil. */
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-3 font-medium text-sidebar-foreground outline-none transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
