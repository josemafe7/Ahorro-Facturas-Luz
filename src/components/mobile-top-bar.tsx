"use client";

import { MenuIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** La barra superior del móvil: la marca y el botón que abre el menú. */
export function MobileTopBar({ brand, primaryAction, user }: { brand: ReactNode; primaryAction: ReactNode; user: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between bg-sidebar px-4 md:hidden">
      {brand}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Abrir el menú"
          className="flex size-9 items-center justify-center rounded-md text-white outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <MenuIcon className="size-5" aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" className="gap-6 border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
          <SheetHeader className="p-0">
            <SheetTitle className="text-white">Menú</SheetTitle>
            <SheetDescription className="sr-only">Secciones de la app y cierre de sesión</SheetDescription>
          </SheetHeader>
          {/* Al pulsar cualquier enlace del menú, el menú se cierra. */}
          <div onClick={() => setOpen(false)}>{primaryAction}</div>
          <div className="flex-1">
            <AppNav onNavigate={() => setOpen(false)} />
          </div>
          {user}
        </SheetContent>
      </Sheet>
    </header>
  );
}
