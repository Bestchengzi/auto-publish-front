import type { PublishPlatformModule } from "../types";
import { getPublishFieldLabel, getTitleFieldError } from "../utils";

export const genericPlatformModule: PublishPlatformModule = {
  ids: [],
  getFieldLabel: getPublishFieldLabel,
  getFieldError: (fieldKey, value) => {
    if (fieldKey === "__title__") {
      return getTitleFieldError("", value);
    }
    return "";
  },
};
