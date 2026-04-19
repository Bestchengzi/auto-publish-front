import { common, createLowlight } from "lowlight";

/** TipTap CodeBlockLowlight 单例，注册常用语言（highlight.js common 集合） */
export const artifactCodeLowlight = createLowlight(common);
