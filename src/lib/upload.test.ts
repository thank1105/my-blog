import { describe, expect, it } from "vitest";

import { saveCoverImage, UploadError } from "./upload";

class FakeFile extends Blob {
  readonly name: string;
  readonly lastModified: number;
  readonly webkitRelativePath = "";
  type: string;

  constructor(name: string, parts: BlobPart[], options: { type?: string } = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
    this.type = options.type ?? "";
  }
}

function makeFile(name: string, head: number[]): FakeFile {
  const tail = Array.from({ length: 1024 }, () => 0x20);
  return new FakeFile(name, [new Uint8Array([...head, ...tail])], { type: "" });
}

describe("saveCoverImage", () => {
  it("accepts JPEG with image/jpeg MIME", async () => {
    const head = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
    const file = makeFile("photo.jpg", head);
    const saved = await saveCoverImage(file as unknown as File);
    expect(saved.url).toMatch(/^\/uploads\/\d{4}-\d{2}\/[a-f0-9]{20}\.jpg$/);
    expect(saved.mime).toBe("image/jpeg");
  });

  it("accepts JPEG via filename when MIME is empty or image/jpg", async () => {
    const head = [0xff, 0xd8, 0xff, 0xdb];
    const file = makeFile("holiday.JPEG", head);
    const saved = await saveCoverImage(file as unknown as File);
    expect(saved.url.endsWith(".jpg")).toBe(true);
  });

  it("accepts JPEG with image/jpg MIME", async () => {
    const head = [0xff, 0xd8, 0xff, 0xe0];
    const file = makeFile("x.jpg", head);
    const saved = await saveCoverImage(file as unknown as File);
    expect(saved.mime).toBe("image/jpeg");
  });

  it("rejects fake JPEG (wrong magic bytes)", async () => {
    const head = [0x00, 0x00, 0x00, 0x00];
    const file = makeFile("evil.jpg", head);
    await expect(saveCoverImage(file as unknown as File)).rejects.toBeInstanceOf(UploadError);
  });

  it("rejects unsupported types with a clear message", async () => {
    const head = [0x25, 0x50, 0x44, 0x46];
    const file = makeFile("doc.pdf", head);
    await expect(saveCoverImage(file as unknown as File)).rejects.toBeInstanceOf(UploadError);
  });
});