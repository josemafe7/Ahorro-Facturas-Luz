"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { FormShell } from "@/components/form/form-shell";
import { TextField } from "@/components/form/text-field";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import type { AiSettings } from "@/data/ai-settings";
import { formatUsd } from "@/lib/format";
import type { ReadingModelOption } from "@/lib/openrouter";

import { removeAiKeyAction, saveAiKeyAction, saveAiModelAction } from "../actions";

const MODEL_FIELD_ID = "ai-model";

/** Regla A6: lo que cuesta un modelo, tal como lo cobra OpenRouter. */
function priceText({ inputPerMillion, outputPerMillion }: ReadingModelOption): string {
  return `Entrada ${formatUsd(inputPerMillion)} · Salida ${formatUsd(outputPerMillion)} por millón de tokens`;
}

/** Regla A5: la clave de OpenRouter del asesor. Puesta, solo se ven sus cuatro últimos caracteres. */
function ApiKeyField({ settings }: { settings: AiSettings }) {
  const [editing, setEditing] = useState(false);

  if (settings.keyHint && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          Tu clave de OpenRouter está puesta: termina en <span className="tabular font-medium">…{settings.keyHint}</span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            Cambiar la clave
          </Button>
          <ConfirmDeleteButton
            showLabel
            label="Quitar la clave"
            title="¿Quitar tu clave de OpenRouter?"
            description={
              settings.installationKey
                ? "Las lecturas con IA volverán a usar la clave de la instalación."
                : "Sin clave, la IA no lee los documentos y sus datos se rellenan a mano."
            }
            successMessage="Clave quitada."
            onConfirm={removeAiKeyAction}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!settings.keyHint && (
        <Notice tone="info">
          {settings.installationKey
            ? "Ahora se usa la clave de la instalación. Si pones la tuya, las lecturas se cobran en tu cuenta de OpenRouter."
            : "Sin clave, la IA no lee los documentos y sus datos se rellenan a mano."}
        </Notice>
      )}
      <FormShell
        action={saveAiKeyAction}
        submitLabel="Guardar la clave"
        pendingLabel="Comprobando la clave…"
        successMessage="Clave guardada: las lecturas con IA ya la usan."
        onSuccess={() => setEditing(false)}
        onCancel={settings.keyHint ? () => setEditing(false) : undefined}
      >
        {(form) => (
          <TextField
            name="apiKey"
            type="password"
            label="Clave de OpenRouter"
            form={form}
            help={
              <>
                Se crea en{" "}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  openrouter.ai/keys
                </a>
                , mejor con un límite de gasto. Se guarda cifrada y no se vuelve a enseñar.
              </>
            }
          />
        )}
      </FormShell>
    </div>
  );
}

type ModelItem = { value: string; label: string; option: ReadingModelOption };

/** Regla A6: el modelo, en un desplegable con buscador que enseña lo que cuesta cada uno. Se guarda al elegirlo. */
function ModelPicker({ current, models }: { current: string; models: ReadingModelOption[] | null }) {
  const [selected, setSelected] = useOptimistic(current);
  const [pending, startTransition] = useTransition();

  if (!models) {
    return (
      <Notice tone="warning" title="No se ha podido cargar la lista de modelos de OpenRouter">
        Se sigue usando {current}. Vuelve a abrir Ajustes dentro de un rato.
      </Notice>
    );
  }

  const items: ModelItem[] = models.map((option) => ({ value: option.id, label: option.name, option }));
  const selectedItem = items.find(({ value }) => value === selected) ?? null;

  function choose(item: ModelItem | null) {
    if (!item || item.value === selected) return;
    startTransition(async () => {
      setSelected(item.value);
      const result = await saveAiModelAction(item.value);
      if (result.ok) toast.success(`Modelo guardado: ${item.label}.`);
      else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={MODEL_FIELD_ID} className="text-sm font-medium">
        Modelo de IA
      </label>
      <Combobox items={items} value={selectedItem} onValueChange={choose} disabled={pending}>
        <ComboboxInput id={MODEL_FIELD_ID} placeholder="Busca por nombre: haiku, gemini, gpt…" className="w-full max-w-xl" />
        <ComboboxContent>
          <ComboboxEmpty>Ningún modelo se llama así.</ComboboxEmpty>
          <ComboboxList>
            {(item: ModelItem) => (
              <ComboboxItem key={item.value} value={item}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[13px] text-muted-foreground">{priceText(item.option)}</span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p className="text-[13px] text-muted-foreground">
        {selectedItem
          ? `${priceText(selectedItem.option)}.`
          : `«${selected}» ya no está entre los modelos de OpenRouter que pueden leer los documentos: elige otro.`}{" "}
        Un token es un trozo de palabra: leer un documento gasta unos pocos miles.
      </p>
    </div>
  );
}

/** Reglas A5 y A6: la clave de OpenRouter y el modelo de IA del asesor. */
export function AiSettingsForm({ settings, models }: { settings: AiSettings; models: ReadingModelOption[] | null }) {
  return (
    <div className="flex flex-col gap-6">
      <ApiKeyField settings={settings} />
      <ModelPicker current={settings.model} models={models} />
    </div>
  );
}
