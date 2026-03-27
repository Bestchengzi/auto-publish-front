export type MaterialType = "image" | "video" | "document";

export type Group = {
  id: string;
  name: string;
};

export type Material = {
  id: string;
  name: string;
  type: MaterialType;
  tags: string[];
  groupId: string | null;
  /** 分组名称，用于展示（当 groupId 对应分组不在 groups 列表中时） */
  groupName?: string | null;
  sizeBytes: number;
  uploadedAt: string;
  /** 描述/备注，对应 API 的 remark */
  description?: string | null;
  /** 预览 URL，图片/视频有值，文档为 null */
  previewUrl?: string | null;
};
