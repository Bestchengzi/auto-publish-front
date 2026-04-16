import type {
  DataConnectionResponse,
  DataConnectorFieldDefinition,
  DataConnectorProviderDefinition,
} from "@/lib/api/data-connectors";

import type { DynamicFieldValue } from "./types";

export function normalizeProviderToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isZhixunbaoConnection(
  providerKey: string | null | undefined,
  providerName: string | null | undefined,
): boolean {
  const normalizedKey = normalizeProviderToken(providerKey);
  const normalizedName = normalizeProviderToken(providerName);

  return (
    normalizedKey.includes("zhixunbao") ||
    normalizedName.includes("zhixunbao") ||
    (providerName ?? "").includes("智讯宝")
  );
}

export function getFieldDisplayLabel(field: DataConnectorFieldDefinition): string {
  return field.label || field.name;
}

export function shouldHideConfigField(
  field: DataConnectorFieldDefinition,
): boolean {
  return field.name === "timeout_seconds";
}

function normalizeFieldToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isBaseUrlField(field: DataConnectorFieldDefinition): boolean {
  return normalizeFieldToken(field.name) === "baseurl";
}

export function isXApiKeyField(field: DataConnectorFieldDefinition): boolean {
  return normalizeFieldToken(field.name) === "xapikey";
}

export function createInitialFieldValues(
  fields: DataConnectorFieldDefinition[],
  sourceValues?: Record<string, unknown>,
): Record<string, DynamicFieldValue> {
  return Object.fromEntries(
    fields.map((field) => {
      const sourceValue = sourceValues?.[field.name];

      if (sourceValue != null) {
        if (field.component === "switch") {
          return [field.name, Boolean(sourceValue)];
        }

        if (typeof sourceValue === "string") {
          return [field.name, sourceValue];
        }

        if (
          typeof sourceValue === "number" ||
          typeof sourceValue === "boolean"
        ) {
          return [field.name, String(sourceValue)];
        }
      }

      if (field.component === "switch") {
        return [field.name, Boolean(field.default)];
      }

      if (typeof field.default === "string") {
        return [field.name, field.default];
      }

      if (
        typeof field.default === "number" ||
        typeof field.default === "boolean"
      ) {
        return [field.name, String(field.default)];
      }

      return [field.name, ""];
    }),
  );
}

export function isMissingRequiredField(
  field: DataConnectorFieldDefinition,
  value: DynamicFieldValue | undefined,
  allowEmptyString = false,
): boolean {
  if (!field.required) return false;
  if (field.component === "switch") return false;
  if (typeof value !== "string") return true;

  const trimmed = value.trim();
  if (allowEmptyString && !trimmed) return false;
  if (!trimmed) return true;

  if (field.component === "number") {
    return Number.isNaN(Number(trimmed));
  }

  return false;
}

export function buildFieldPayload(
  fields: DataConnectorFieldDefinition[],
  values: Record<string, DynamicFieldValue>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const rawValue = values[field.name];

    if (field.component === "switch") {
      payload[field.name] = Boolean(rawValue);
      continue;
    }

    if (typeof rawValue !== "string") continue;

    const trimmed = rawValue.trim();
    if (!trimmed) {
      if (field.name === "timeout_seconds") {
        if (typeof field.default === "number") {
          payload[field.name] = field.default;
          continue;
        }

        if (typeof field.default === "string") {
          const numericDefault = Number(field.default);
          payload[field.name] = Number.isNaN(numericDefault)
            ? field.default
            : numericDefault;
          continue;
        }
      }

      continue;
    }

    if (field.component === "number") {
      const numericValue = Number(trimmed);
      if (!Number.isNaN(numericValue)) {
        payload[field.name] = numericValue;
      }
      continue;
    }

    payload[field.name] = trimmed;
  }

  return payload;
}

export function findProviderForConnection(
  providers: DataConnectorProviderDefinition[],
  connection: DataConnectionResponse | null,
): DataConnectorProviderDefinition | null {
  if (!connection) return null;

  return (
    providers.find(
      (provider) =>
        provider.key === connection.provider_key ||
        normalizeProviderToken(provider.key) ===
          normalizeProviderToken(connection.provider_key),
    ) ?? null
  );
}

export function getProviderLogoSrc(
  provider: DataConnectorProviderDefinition,
): string | null {
  const normalizedKey = normalizeProviderToken(provider.key);
  if (normalizedKey.includes("zhixunbao")) {
    return "/platform-logos/zhi-xun-bao.png";
  }

  return null;
}

export function getConnectionLogoSrc(
  connection: DataConnectionResponse,
): string | null {
  if (isZhixunbaoConnection(connection.provider_key, connection.provider_name)) {
    return "/platform-logos/zhi-xun-bao.png";
  }

  return null;
}
