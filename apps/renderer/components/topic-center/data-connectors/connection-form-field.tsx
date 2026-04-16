"use client";

import * as React from "react";

import type {
  DataConnectionSecretState,
  DataConnectorFieldDefinition,
} from "@/lib/api/data-connectors";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { FIELD_SELECT_EMPTY_VALUE } from "./constants";
import type {
  ConnectionDialogMode,
  DynamicFieldValue,
  FieldTarget,
  TopicCenterTranslator,
} from "./types";
import {
  getFieldDisplayLabel,
  isBaseUrlField,
  isXApiKeyField,
} from "./utils";

function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden>
      *
    </span>
  );
}

function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      className="pointer-events-none absolute top-full left-0 z-10 mt-1 max-w-full text-xs text-red-500"
      role="alert"
    >
      {message}
    </p>
  );
}

export type ConnectionFormFieldProps = {
  field: DataConnectorFieldDefinition;
  fieldId: string;
  mode: ConnectionDialogMode;
  target: FieldTarget;
  value: DynamicFieldValue | undefined;
  hasError: boolean;
  errorMessage?: string;
  existingSecretState?: DataConnectionSecretState | null;
  onValueChange: (value: DynamicFieldValue) => void;
  onBlur: () => void;
  t: TopicCenterTranslator;
};

export function ConnectionFormField({
  field,
  fieldId,
  mode,
  target,
  value,
  hasError,
  errorMessage,
  existingSecretState,
  onValueChange,
  onBlur,
  t,
}: ConnectionFormFieldProps) {
  const isLockedField =
    isBaseUrlField(field) || (mode === "edit" && isXApiKeyField(field));
  const fieldEnterPlaceholder = t("dataConnectors.configDialog.enterPlaceholder", {
    name: getFieldDisplayLabel(field),
  });
  const helpText = field.help_text?.trim() ? field.help_text.trim() : null;
  const secretPlaceholder =
    typeof value === "string" && value.trim()
      ? fieldEnterPlaceholder
      : existingSecretState?.masked_value ??
        (existingSecretState?.has_value
          ? t("dataConnectors.configDialog.savedSecretPlaceholder")
          : fieldEnterPlaceholder);

  if (field.component === "switch") {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">
              {getFieldDisplayLabel(field)}
              {field.required ? <RequiredMark /> : null}
            </div>
            {helpText ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {helpText}
              </p>
            ) : null}
          </div>
          <Switch
            checked={Boolean(value)}
            disabled={isLockedField}
            onCheckedChange={(checked) => onValueChange(checked)}
            aria-label={getFieldDisplayLabel(field)}
          />
        </div>
      </div>
    );
  }

  let control: React.ReactNode = null;

  if (field.component === "textarea") {
    control = (
      <Textarea
        id={fieldId}
        value={typeof value === "string" ? value : ""}
        resizeMode="vertical"
        placeholder={target === "secret" ? secretPlaceholder : fieldEnterPlaceholder}
        className={cn(
          "min-h-[120px] bg-muted/40",
          isLockedField && "cursor-not-allowed bg-muted/60 opacity-80",
          hasError && "border-destructive ring-1 ring-destructive/35",
        )}
        disabled={isLockedField}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={() => {
          if (isLockedField) return;
          onBlur();
        }}
      />
    );
  } else if (field.component === "select") {
    const selectedOptionLabel =
      field.options?.find((option) => option.value === value)?.label ?? "";

    control = (
      <Select
        disabled={isLockedField}
        value={
          typeof value === "string" && value ? value : FIELD_SELECT_EMPTY_VALUE
        }
        onValueChange={(nextValue) =>
          onValueChange(
            nextValue == null || nextValue === FIELD_SELECT_EMPTY_VALUE
              ? ""
              : nextValue,
          )
        }
      >
        <SelectTrigger
          className={cn(
            "h-10 w-full bg-muted/40",
            isLockedField && "cursor-not-allowed bg-muted/60 opacity-80",
            hasError && "border-destructive ring-1 ring-destructive/35",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            {selectedOptionLabel ||
              field.placeholder ||
              t("dataConnectors.configDialog.selectPlaceholder")}
          </span>
          <SelectValue className="sr-only" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FIELD_SELECT_EMPTY_VALUE}>
            {field.placeholder ||
              t("dataConnectors.configDialog.selectPlaceholder")}
          </SelectItem>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    const inputType =
      field.component === "password"
        ? "password"
        : field.component === "number"
          ? "number"
          : "text";

    control = (
      <Input
        id={fieldId}
        type={inputType}
        value={typeof value === "string" ? value : ""}
        placeholder={target === "secret" ? secretPlaceholder : fieldEnterPlaceholder}
        className={cn(
          "bg-muted/40",
          isLockedField && "cursor-not-allowed bg-muted/60 opacity-80",
          hasError && "border-destructive ring-1 ring-destructive/35",
        )}
        disabled={isLockedField}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={() => {
          if (isLockedField) return;
          onBlur();
        }}
      />
    );
  }

  return (
    <div className="relative">
      <label
        htmlFor={fieldId}
        className="mb-2 block text-sm font-medium leading-none"
      >
        {getFieldDisplayLabel(field)}
        {field.required ? <RequiredMark /> : null}
      </label>
      {control}
      {helpText ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {helpText}
        </p>
      ) : null}
      {hasError && errorMessage ? (
        <FieldError id={`${fieldId}-error`} message={errorMessage} />
      ) : null}
    </div>
  );
}
