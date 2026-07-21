import { describe, expect, it } from "vitest";

import {
  defaultAboutMeta,
  parseAboutMeta,
  serializeAboutMeta,
  validateAboutMetaJson,
} from "./about-meta";

describe("about meta", () => {
  it("returns safe defaults for empty or malformed persisted data", () => {
    expect(parseAboutMeta(null)).toEqual(defaultAboutMeta);
    expect(parseAboutMeta("not-json")).toEqual(defaultAboutMeta);
    expect(parseAboutMeta(JSON.stringify({ unknown: true }))).toEqual(defaultAboutMeta);
  });

  it("parses and serializes structured profile data", () => {
    const value = {
      ...defaultAboutMeta,
      displayName: "小川",
      socialLinks: [{ label: "GitHub", url: "https://github.com/example" }],
      skills: ["写作"],
      timeline: [{ year: "2024", title: "开始创作", description: "持续记录。" }],
    };
    const serialized = serializeAboutMeta(value);
    expect(parseAboutMeta(serialized)).toEqual(value);
    expect(validateAboutMetaJson(serialized).ok).toBe(true);
  });

  it("omits blank repeaters and trims duplicate skills on serialization", () => {
    const serialized = serializeAboutMeta({
      ...defaultAboutMeta,
      socialLinks: [{ label: "", url: "" }],
      skills: [" Writing ", "Writing"],
      timeline: [{ year: "", title: "", description: "" }],
    });
    expect(JSON.parse(serialized)).toMatchObject({
      socialLinks: [],
      skills: ["Writing"],
      timeline: [],
    });
  });

  it("rejects unsafe social link protocols at the server boundary", () => {
    const result = validateAboutMetaJson(
      JSON.stringify({
        ...defaultAboutMeta,
        socialLinks: [{ label: "bad", url: "javascript:alert(1)" }],
      }),
    );
    expect(result.ok).toBe(false);
  });
});
