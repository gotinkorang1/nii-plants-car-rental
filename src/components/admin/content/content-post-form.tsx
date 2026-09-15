"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { slugify } from "@/lib/fleet/slug";
import type { ContentPostKind } from "@/lib/validation/content";

export type PostMediaOption = {
  id: string;
  altText: string;
  originalFilename: string;
  url: string | null;
};

const kindLabels: Record<ContentPostKind, string> = {
  news: "News",
  blog: "Blog",
  video: "Video",
  gallery: "Gallery album",
};

export function ContentPostForm({
  action,
  defaults,
  submitLabel,
  kinds,
  media,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    kind: ContentPostKind;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    seoTitle: string | null;
    seoDescription: string | null;
    coverMediaId: string | null;
    videoUrl: string | null;
    publishedOn: string;
    sortOrder: number;
    mediaIds: string[];
    published: boolean;
  };
  submitLabel: string;
  kinds: readonly ContentPostKind[];
  media: PostMediaOption[];
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [body, setBody] = useState(defaults?.body ?? "<p></p>");
  const [kind, setKind] = useState<ContentPostKind>(defaults?.kind ?? kinds[0] ?? "news");
  const lockedKind = kinds.length === 1;

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}

      {lockedKind ? (
        <input type="hidden" name="kind" value={kind} />
      ) : (
        <Field label="Type" htmlFor="kind">
          <select
            id="kind"
            name="kind"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={kind}
            onChange={(event) => setKind(event.target.value as ContentPostKind)}
          >
            {kinds.map((item) => (
              <option key={item} value={item}>
                {kindLabels[item]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Title" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title}
          onChange={(event) => {
            if (!defaults?.published) {
              setSlug(slugify(event.target.value));
            }
          }}
        />
      </Field>
      <Field label="Slug" htmlFor="slug">
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </Field>
      <Field label="Excerpt" htmlFor="excerpt">
        <Textarea id="excerpt" name="excerpt" defaultValue={defaults?.excerpt} />
      </Field>

      {kind === "video" ? (
        <Field label="YouTube or Vimeo link" htmlFor="videoUrl">
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v="
            defaultValue={defaults?.videoUrl ?? ""}
            required
          />
        </Field>
      ) : (
        <input type="hidden" name="videoUrl" value="" />
      )}

      {kind !== "gallery" ? (
        <Field label="Cover image" htmlFor="coverMediaId">
          <select
            id="coverMediaId"
            name="coverMediaId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={defaults?.coverMediaId ?? ""}
          >
            <option value="">No cover (site default)</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.originalFilename} — {item.altText}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Upload images in Media first, then attach them here.
          </p>
        </Field>
      ) : (
        <input type="hidden" name="coverMediaId" value={defaults?.coverMediaId ?? ""} />
      )}

      {kind === "gallery" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Album photos</legend>
          {media.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload photos in Website → Media, then return here to build the album.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {media.map((item) => (
                <li key={item.id}>
                  <label className="flex items-start gap-2 rounded-lg bg-card p-3 text-sm ring-1 ring-border">
                    <input
                      type="checkbox"
                      name="mediaIds"
                      value={item.id}
                      defaultChecked={defaults?.mediaIds.includes(item.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{item.originalFilename}</span>
                      <span className="text-muted-foreground">{item.altText}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      ) : null}

      {kind === "gallery" ? (
        <Field label="Display order" htmlFor="sortOrder">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={1000}
            defaultValue={defaults?.sortOrder ?? 0}
          />
        </Field>
      ) : (
        <input type="hidden" name="sortOrder" value={String(defaults?.sortOrder ?? 0)} />
      )}

      {kind !== "gallery" ? (
        <Field label="Body" htmlFor="body">
          <input type="hidden" name="body" value={body} />
          <div className="mb-2 flex flex-wrap gap-1">
            {["p", "h2", "h3", "ul"].map((tag) => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setBody((current) => `${current}<${tag}></${tag === "ul" ? "ul" : tag}>`)
                }
              >
                {tag}
              </Button>
            ))}
          </div>
          <Textarea
            id="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={12}
            required={kind === "news" || kind === "blog"}
          />
          <p className="text-xs text-muted-foreground">
            Allowed tags: p, h2, h3, ul, ol, li, a, strong, em, br, blockquote.
          </p>
        </Field>
      ) : (
        <Field label="Album introduction" htmlFor="body">
          <Textarea
            id="body"
            name="body"
            defaultValue={defaults?.body}
            rows={4}
          />
        </Field>
      )}

      <Field label="Publish date" htmlFor="publishedOn">
        <Input
          id="publishedOn"
          name="publishedOn"
          type="date"
          defaultValue={defaults?.publishedOn}
        />
      </Field>
      <Field label="SEO title" htmlFor="seoTitle">
        <Input id="seoTitle" name="seoTitle" defaultValue={defaults?.seoTitle ?? ""} />
      </Field>
      <Field label="SEO description" htmlFor="seoDescription">
        <Textarea
          id="seoDescription"
          name="seoDescription"
          defaultValue={defaults?.seoDescription ?? ""}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={defaults?.published} />
        Published on the public site
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
