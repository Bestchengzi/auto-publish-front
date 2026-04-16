"use client";

import * as React from "react";

import type {
  DataConnectionResponse,
  DataConnectorFieldDefinition,
  DataConnectorProviderDefinition,
} from "@/lib/api/data-connectors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ConnectionFormField } from "./connection-form-field";
import type {
  ConnectionDialogMode,
  ConnectionFormSubmitPayload,
  DynamicFieldErrors,
  DynamicFieldTouched,
  DynamicFieldValue,
  FieldTarget,
  TopicCenterTranslator,
} from "./types";
import {
  buildFieldPayload,
  createInitialFieldValues,
  getFieldDisplayLabel,
  isBaseUrlField,
  isMissingRequiredField,
  isXApiKeyField,
  shouldHideConfigField,
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

export type ConnectionConfigDialogProps = {
  open: boolean;
  mode: ConnectionDialogMode;
  provider: DataConnectorProviderDefinition | null;
  connection: DataConnectionResponse | null;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ConnectionFormSubmitPayload) => Promise<void>;
  t: TopicCenterTranslator;
};

export function ConnectionConfigDialog({
  open,
  mode,
  provider,
  connection,
  submitting,
  onOpenChange,
  onSubmit,
  t,
}: ConnectionConfigDialogProps) {
  const allConfigFields = React.useMemo(
    () => provider?.config_fields ?? [],
    [provider?.config_fields],
  );
  const allSecretFields = React.useMemo(
    () => provider?.secret_fields ?? [],
    [provider?.secret_fields],
  );
  const [connectionName, setConnectionName] = React.useState("");
  const [configValues, setConfigValues] = React.useState<
    Record<string, DynamicFieldValue>
  >({});
  const [secretValues, setSecretValues] = React.useState<
    Record<string, DynamicFieldValue>
  >({});
  const [fieldErrors, setFieldErrors] = React.useState<DynamicFieldErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<DynamicFieldTouched>({});
  const secretStateMap = React.useMemo(
    () =>
      new Map(
        (connection?.secret_states ?? []).map((secretState) => [
          secretState.name,
          secretState,
        ]),
      ),
    [connection?.secret_states],
  );

  React.useEffect(() => {
    if (!open || !provider) return;

    setConnectionName(connection?.name ?? "");
    setConfigValues(createInitialFieldValues(allConfigFields, connection?.config));
    setSecretValues(createInitialFieldValues(allSecretFields));
    setFieldErrors({});
    setTouchedFields({});
  }, [allConfigFields, allSecretFields, connection, open, provider]);

  const clearFieldError = React.useCallback((fieldKey: string) => {
    setFieldErrors((prev) => {
      if (prev[fieldKey] == null) return prev;

      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const validateField = React.useCallback(
    (
      field: DataConnectorFieldDefinition,
      value: DynamicFieldValue | undefined,
      target: FieldTarget,
    ) => {
      const allowEmptySecret =
        target === "secret" &&
        mode === "edit" &&
        secretStateMap.get(field.name)?.has_value === true;

      if (isMissingRequiredField(field, value, allowEmptySecret)) {
        setFieldErrors((prev) => ({
          ...prev,
          [field.name]: t("dataConnectors.configDialog.validation.required", {
            name: getFieldDisplayLabel(field),
          }),
        }));
        return;
      }

      clearFieldError(field.name);
    },
    [clearFieldError, mode, secretStateMap, t],
  );

  const handleValueChange = React.useCallback(
    (
      field: DataConnectorFieldDefinition,
      nextValue: DynamicFieldValue,
      target: FieldTarget,
    ) => {
      if (target === "config") {
        setConfigValues((prev) => ({ ...prev, [field.name]: nextValue }));
      } else {
        setSecretValues((prev) => ({ ...prev, [field.name]: nextValue }));
      }

      if (touchedFields[field.name]) {
        validateField(field, nextValue, target);
      }
    },
    [touchedFields, validateField],
  );

  const handleBlur = React.useCallback(
    (
      field: DataConnectorFieldDefinition,
      value: DynamicFieldValue | undefined,
      target: FieldTarget,
    ) => {
      setTouchedFields((prev) => ({ ...prev, [field.name]: true }));
      validateField(field, value, target);
    },
    [validateField],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!provider) return;

    const nextErrors: DynamicFieldErrors = {};
    const trimmedName = connectionName.trim();

    if (!trimmedName) {
      nextErrors.connectionName = t(
        "dataConnectors.configDialog.validation.required",
        {
          name: t("dataConnectors.configDialog.nameLabel"),
        },
      );
    }

    for (const field of allConfigFields) {
      if (shouldHideConfigField(field)) continue;
      if (isBaseUrlField(field)) continue;

      if (isMissingRequiredField(field, configValues[field.name])) {
        nextErrors[field.name] = t(
          "dataConnectors.configDialog.validation.required",
          {
            name: getFieldDisplayLabel(field),
          },
        );
      }
    }

    for (const field of allSecretFields) {
      if (mode === "edit" && isXApiKeyField(field)) continue;

      const allowEmptySecret =
        mode === "edit" && secretStateMap.get(field.name)?.has_value === true;

      if (isMissingRequiredField(field, secretValues[field.name], allowEmptySecret)) {
        nextErrors[field.name] = t(
          "dataConnectors.configDialog.validation.required",
          {
            name: getFieldDisplayLabel(field),
          },
        );
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setTouchedFields((prev) => ({
        ...prev,
        connectionName: true,
        ...Object.fromEntries(Object.keys(nextErrors).map((key) => [key, true])),
      }));
      return;
    }

    setFieldErrors({});
    await onSubmit({
      provider_key: provider.key,
      name: trimmedName,
      enabled: connection?.enabled ?? true,
      config: buildFieldPayload(allConfigFields, configValues),
      secrets: buildFieldPayload(allSecretFields, secretValues),
      default_query: connection?.default_query,
    });
  }, [
    allConfigFields,
    allSecretFields,
    configValues,
    connection?.default_query,
    connection?.enabled,
    connectionName,
    mode,
    onSubmit,
    provider,
    secretStateMap,
    secretValues,
    t,
  ]);

  if (!provider) {
    return null;
  }

  const nameError =
    touchedFields.connectionName && fieldErrors.connectionName
      ? fieldErrors.connectionName
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,780px)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>
            {mode === "edit"
              ? t("dataConnectors.configDialog.editTitle")
              : t("dataConnectors.configDialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-8">
          <div className="space-y-7">
            <div className="relative">
              <label
                htmlFor="data-connector-name"
                className="mb-2 block text-sm font-medium leading-none"
              >
                {t("dataConnectors.configDialog.nameLabel")}
                <RequiredMark />
              </label>
              <Input
                id="data-connector-name"
                value={connectionName}
                placeholder={t("dataConnectors.configDialog.enterPlaceholder", {
                  name: t("dataConnectors.configDialog.nameLabel"),
                })}
                className={cn(
                  "bg-muted/40",
                  nameError && "border-destructive ring-1 ring-destructive/35",
                )}
                onChange={(event) => {
                  setConnectionName(event.target.value);
                  clearFieldError("connectionName");
                }}
                onBlur={() => {
                  setTouchedFields((prev) => ({ ...prev, connectionName: true }));

                  if (!connectionName.trim()) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      connectionName: t(
                        "dataConnectors.configDialog.validation.required",
                        {
                          name: t("dataConnectors.configDialog.nameLabel"),
                        },
                      ),
                    }));
                    return;
                  }

                  clearFieldError("connectionName");
                }}
              />
              {nameError ? (
                <FieldError id="data-connector-name-error" message={nameError} />
              ) : null}
            </div>

            {allConfigFields
              .filter((field) => !shouldHideConfigField(field))
              .map((field, index) => {
                const value = configValues[field.name];

                return (
                  <ConnectionFormField
                    key={`config-${field.name}`}
                    field={field}
                    fieldId={`config-${field.name}-${index}`}
                    mode={mode}
                    target="config"
                    value={value}
                    hasError={Boolean(
                      touchedFields[field.name] && fieldErrors[field.name],
                    )}
                    errorMessage={fieldErrors[field.name]}
                    onValueChange={(nextValue) =>
                      handleValueChange(field, nextValue, "config")
                    }
                    onBlur={() => handleBlur(field, value, "config")}
                    t={t}
                  />
                );
              })}

            {allSecretFields.map((field, index) => {
              const value = secretValues[field.name];

              return (
                <ConnectionFormField
                  key={`secret-${field.name}`}
                  field={field}
                  fieldId={`secret-${field.name}-${index}`}
                  mode={mode}
                  target="secret"
                  value={value}
                  hasError={Boolean(
                    touchedFields[field.name] && fieldErrors[field.name],
                  )}
                  errorMessage={fieldErrors[field.name]}
                  existingSecretState={secretStateMap.get(field.name)}
                  onValueChange={(nextValue) =>
                    handleValueChange(field, nextValue, "secret")
                  }
                  onBlur={() => handleBlur(field, value, "secret")}
                  t={t}
                />
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-0 shrink-0 border-t border-border px-6 py-5">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {t("dataConnectors.configDialog.cancel")}
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting
              ? mode === "edit"
                ? t("dataConnectors.configDialog.updating")
                : t("dataConnectors.configDialog.submitting")
              : mode === "edit"
                ? t("dataConnectors.configDialog.update")
                : t("dataConnectors.configDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
