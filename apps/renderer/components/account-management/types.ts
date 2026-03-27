import type { PlatformId as LibPlatformId } from "@/lib/platforms";

export type PlatformId = LibPlatformId;
export type StatusId = "online" | "offline";

export type Platform = {
  id: PlatformId;
  name: string;
  logo: string;
};

export type Group = {
  id: string;
  name: string;
};

export type Account = {
  id: string;
  name: string;
  followers: number;
  platformId: PlatformId;
  /** Groups this account belongs to. Empty = no group, display as "--". */
  groupIds: string[];
  status: StatusId;
  updatedAt: string;
  avatarSeed: string;
  /** Optional avatar image URL. When set, displays portrait instead of colored letter. */
  avatar?: string | null;
};
