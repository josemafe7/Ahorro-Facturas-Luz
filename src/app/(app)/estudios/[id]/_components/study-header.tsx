import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { appConfig } from "@/config/app";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const { study: texts } = appConfig.sector.texts;

const TABS = [
  { key: "data", label: "Datos", href: routes.study },
  { key: "comparison", label: "Comparativa", href: routes.studyComparison },
] as const;

/** La cabecera de un estudio: volver a la lista, a nombre de quién está, y sus dos vistas. */
export function StudyHeader({
  studyId,
  customerName,
  active,
  action,
}: {
  studyId: string;
  customerName: string | null;
  active: (typeof TABS)[number]["key"];
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <Link href={routes.studies} className="mb-3 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden />
        {texts.plural}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{customerName ?? texts.new}</h1>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <nav aria-label="Vistas del estudio" className="mt-4 flex gap-6 border-b">
        {TABS.map(({ key, label, href }) => (
          <Link
            key={key}
            href={href(studyId)}
            aria-current={active === key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2.5 font-medium transition-colors",
              active === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
