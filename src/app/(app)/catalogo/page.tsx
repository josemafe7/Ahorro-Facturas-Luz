import { PencilIcon, PlusIcon, TagsIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appConfig } from "@/config/app";
import { listOffers } from "@/data/offers";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { offerColumns } from "@/sectors/ui";

import { DeleteOfferButton } from "./_components/delete-offer-button";
import { OfferActiveSwitch } from "./_components/offer-active-switch";

const { offer: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.catalogTitle };

function AddOfferLink() {
  return (
    <Link href={routes.newOffer} className={buttonVariants()}>
      <PlusIcon aria-hidden />
      {texts.add}
    </Link>
  );
}

export default async function CatalogPage() {
  const user = await requireUser();
  const offers = await listOffers(user.id);

  if (offers.length === 0) {
    return (
      <>
        <PageHeader title={texts.catalogTitle} />
        <EmptyState icon={TagsIcon} title={texts.empty} action={<AddOfferLink />} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={texts.catalogTitle} action={<AddOfferLink />} />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-muted-foreground">Tarifa</TableHead>
              {offerColumns.map(({ header }) => (
                <TableHead key={header} className="px-4 text-muted-foreground">
                  {header}
                </TableHead>
              ))}
              <TableHead className="px-4 text-muted-foreground">Activa</TableHead>
              <TableHead className="px-4">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map(({ id, label, active, offer }) => (
              <TableRow key={id} className={cn("h-12", !active && "text-muted-foreground")}>
                <TableCell className="px-4 font-medium">{label}</TableCell>
                {offerColumns.map(({ header, render }) => (
                  <TableCell key={header} className="tabular px-4">
                    {render(offer)}
                  </TableCell>
                ))}
                <TableCell className="px-4">
                  <OfferActiveSwitch id={id} active={active} label={label} />
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={routes.offer(id)}
                      aria-label={`${texts.edit}: ${label}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground")}
                    >
                      <PencilIcon aria-hidden />
                    </Link>
                    <DeleteOfferButton id={id} label={label} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
