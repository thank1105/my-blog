"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";

import type { AboutMeta } from "@/lib/about-meta";
import { AvatarUploader } from "./AvatarUploader";

export interface AboutMetaEditorProps {
  value: AboutMeta;
  onChange: (next: AboutMeta) => void;
}

export function AboutMetaEditor({ value, onChange }: AboutMetaEditorProps) {
  const [skillInput, setSkillInput] = useState("");

  function update(patch: Partial<AboutMeta>) {
    onChange({ ...value, ...patch });
  }

  function updateSocialLink(index: number, patch: Partial<AboutMeta["socialLinks"][number]>) {
    update({
      socialLinks: value.socialLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    });
  }

  function moveSocialLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.socialLinks.length) return;
    const socialLinks = [...value.socialLinks];
    [socialLinks[index], socialLinks[target]] = [socialLinks[target], socialLinks[index]];
    update({ socialLinks });
  }

  function addSocialLink() {
    update({ socialLinks: [...value.socialLinks, { label: "", url: "" }] });
  }

  function removeSocialLink(index: number) {
    update({ socialLinks: value.socialLinks.filter((_, i) => i !== index) });
  }

  function addSkill() {
    const skill = skillInput.trim();
    if (!skill || value.skills.includes(skill)) return;
    update({ skills: [...value.skills, skill] });
    setSkillInput("");
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  }

  function updateTimelineItem(index: number, patch: Partial<AboutMeta["timeline"][number]>) {
    update({
      timeline: value.timeline.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  function moveTimelineItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.timeline.length) return;
    const timeline = [...value.timeline];
    [timeline[index], timeline[target]] = [timeline[target], timeline[index]];
    update({ timeline });
  }

  function addTimelineItem() {
    update({
      timeline: [...value.timeline, { year: "", title: "", description: "" }],
    });
  }

  function removeTimelineItem(index: number) {
    update({ timeline: value.timeline.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="mb-4">
          <h2 className="font-serif text-lg font-bold text-ink">个人资料</h2>
          <p className="mt-1 text-xs text-muted">头像和基本信息会显示在关于我页面顶部。</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
          <AvatarUploader value={value.avatar} onChange={(avatar) => update({ avatar })} />
          <div className="grid gap-4">
            <TextField
              id="about-display-name"
              label="显示名称"
              value={value.displayName}
              onChange={(displayName) => update({ displayName })}
              placeholder="例如：小川"
            />
            <TextField
              id="about-tagline"
              label="一句话简介"
              value={value.tagline}
              onChange={(tagline) => update({ tagline })}
              placeholder="例如：独立创作者，写作、观察、做项目。"
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <SectionHeader
          title="社交链接"
          description="添加 GitHub、邮箱或其他希望访客找到你的链接。"
          actionLabel="添加链接"
          onAction={addSocialLink}
        />
        {value.socialLinks.length === 0 ? (
          <EmptyHint text="暂未添加社交链接。" />
        ) : (
          <div className="space-y-3">
            {value.socialLinks.map((link, index) => (
              <div key={index} className="rounded border border-hair bg-bg/40 p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] md:items-end">
                  <TextField
                    id={`about-social-label-${index}`}
                    label="名称"
                    value={link.label}
                    onChange={(label) => updateSocialLink(index, { label })}
                    placeholder="GitHub"
                  />
                  <TextField
                    id={`about-social-url-${index}`}
                    label="链接地址"
                    value={link.url}
                    onChange={(url) => updateSocialLink(index, { url })}
                    placeholder="https://github.com/..."
                  />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="上移链接"
                      disabled={index === 0}
                      onClick={() => moveSocialLink(index, -1)}
                    >
                      <ArrowUp aria-hidden className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="下移链接"
                      disabled={index === value.socialLinks.length - 1}
                      onClick={() => moveSocialLink(index, 1)}
                    >
                      <ArrowDown aria-hidden className="size-3.5" />
                    </IconButton>
                    <IconButton label="删除链接" danger onClick={() => removeSocialLink(index)}>
                      <Trash2 aria-hidden className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="mb-4">
          <h2 className="font-serif text-lg font-bold text-ink">技能标签</h2>
          <p className="mt-1 text-xs text-muted">输入技能名称后按 Enter 添加。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded border border-hair bg-bg/40 p-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          {value.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent"
            >
              {skill}
              <button
                type="button"
                aria-label={`移除技能 ${skill}`}
                onClick={() => update({ skills: value.skills.filter((item) => item !== skill) })}
                className="rounded-full p-0.5 hover:bg-accent/20"
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="例如：写作"
            className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none"
          />
        </div>
      </section>

      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <SectionHeader
          title="经历时间线"
          description="按时间顺序记录重要经历，使用上下箭头调整顺序。"
          actionLabel="添加经历"
          onAction={addTimelineItem}
        />
        {value.timeline.length === 0 ? (
          <EmptyHint text="暂未添加经历。" />
        ) : (
          <div className="space-y-3">
            {value.timeline.map((item, index) => (
              <div key={index} className="rounded border border-hair bg-bg/40 p-3">
                <div className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-end">
                  <TextField
                    id={`about-timeline-year-${index}`}
                    label="年份 / 时间"
                    value={item.year}
                    onChange={(year) => updateTimelineItem(index, { year })}
                    placeholder="2024"
                  />
                  <TextField
                    id={`about-timeline-title-${index}`}
                    label="标题"
                    value={item.title}
                    onChange={(title) => updateTimelineItem(index, { title })}
                    placeholder="开始独立创作"
                  />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="上移经历"
                      disabled={index === 0}
                      onClick={() => moveTimelineItem(index, -1)}
                    >
                      <ArrowUp aria-hidden className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="下移经历"
                      disabled={index === value.timeline.length - 1}
                      onClick={() => moveTimelineItem(index, 1)}
                    >
                      <ArrowDown aria-hidden className="size-3.5" />
                    </IconButton>
                    <IconButton label="删除经历" danger onClick={() => removeTimelineItem(index)}>
                      <Trash2 aria-hidden className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
                <label
                  htmlFor={`about-timeline-description-${index}`}
                  className="mt-3 block text-xs font-medium text-muted"
                >
                  描述
                </label>
                <textarea
                  id={`about-timeline-description-${index}`}
                  rows={2}
                  value={item.description}
                  onChange={(event) =>
                    updateTimelineItem(index, { description: event.target.value })
                  }
                  placeholder="补充这段经历的背景或成果"
                  className="mt-1 block w-full resize-y rounded border border-hair bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded border border-hair bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1 rounded border border-hair bg-bg px-2.5 py-1.5 text-xs text-ink hover:border-accent hover:text-accent"
      >
        <Plus aria-hidden className="size-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded border border-dashed border-hair px-3 py-4 text-center text-xs text-muted">
      {text}
    </p>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-8 items-center justify-center rounded border border-hair bg-surface transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${danger ? "text-danger hover:border-danger hover:text-danger" : "text-muted hover:border-accent hover:text-accent"}`}
    >
      {children}
    </button>
  );
}
