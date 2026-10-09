import { AppSidebar, BrandLink, SidebarUser } from "@/components/app-sidebar";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { requireUser } from "@/lib/session";

/**
 * El armazón de las pantallas privadas: el menú y el contenido. Pide el usuario para enseñarlo en el menú;
 * la comprobación de seguridad la repite cada página, porque un layout no se vuelve a ejecutar al navegar.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar user={user} />
      <MobileTopBar brand={<BrandLink />} user={<SidebarUser user={user} />} />
      <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
