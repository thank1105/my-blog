import { z } from "zod";

const aboutUrlSchema = z
  .string()
  .trim()
  .max(500, "链接地址不超过 500 字")
  .refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:", "mailto:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "链接必须是 http、https 或 mailto 地址");

const socialLinkSchema = z.object({
  label: z.string().trim().min(1, "链接名称不能为空").max(40, "链接名称不超过 40 字"),
  url: aboutUrlSchema,
});

const timelineItemSchema = z.object({
  year: z.string().trim().min(1, "年份不能为空").max(30, "年份不超过 30 字"),
  title: z.string().trim().min(1, "经历标题不能为空").max(100, "经历标题不超过 100 字"),
  description: z.string().trim().max(500, "经历描述不超过 500 字"),
});

export const aboutMetaSchema = z.object({
  avatar: z.string().trim().max(500, "头像地址不超过 500 字").default(""),
  displayName: z.string().trim().max(80, "显示名称不超过 80 字").default(""),
  tagline: z.string().trim().max(160, "一句话简介不超过 160 字").default(""),
  socialLinks: z.array(socialLinkSchema).max(20, "社交链接最多 20 条").default([]),
  skills: z.array(z.string().trim().min(1).max(40)).max(30, "技能最多 30 项").default([]),
  timeline: z.array(timelineItemSchema).max(30, "经历最多 30 条").default([]),
});

export type AboutMeta = z.infer<typeof aboutMetaSchema>;

export const defaultAboutMeta: AboutMeta = {
  avatar: "",
  displayName: "",
  tagline: "",
  socialLinks: [],
  skills: [],
  timeline: [],
};

function cloneDefaultAboutMeta(): AboutMeta {
  return {
    ...defaultAboutMeta,
    socialLinks: [],
    skills: [],
    timeline: [],
  };
}

/** Parse persisted About metadata without allowing malformed data to break the page. */
export function parseAboutMeta(value: string | null | undefined): AboutMeta {
  if (!value?.trim()) return cloneDefaultAboutMeta();
  try {
    const parsed = aboutMetaSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : cloneDefaultAboutMeta();
  } catch {
    return cloneDefaultAboutMeta();
  }
}

/** Validate a serialized About metadata value at the server boundary. */
export function validateAboutMetaJson(
  value: string | null | undefined,
): { ok: true; data: AboutMeta } | { ok: false; error: string } {
  if (!value?.trim()) return { ok: true, data: cloneDefaultAboutMeta() };
  try {
    const parsed = aboutMetaSchema.safeParse(JSON.parse(value));
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, error: parsed.error.issues[0]?.message ?? "关于我资料格式不正确" };
  } catch {
    return { ok: false, error: "关于我资料格式不正确" };
  }
}

export function serializeAboutMeta(value: AboutMeta): string {
  const cleaned: AboutMeta = {
    ...value,
    socialLinks: value.socialLinks.filter((link) => link.label.trim() || link.url.trim()),
    skills: [...new Set(value.skills.map((skill) => skill.trim()).filter(Boolean))],
    timeline: value.timeline.filter(
      (item) => item.year.trim() || item.title.trim() || item.description.trim(),
    ),
  };
  return JSON.stringify(aboutMetaSchema.parse(cleaned));
}
