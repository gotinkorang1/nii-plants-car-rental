"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { slugify } from "@/lib/fleet/slug";

export function ContentPageForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    seoTitle: string | null;
    seoDescription: string | null;
    published: boolean;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [body, setBody] = useState(defaults?.body ?? "<p></p>");

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
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
          rows={14}
          required
        />
        <p className="text-xs text-muted-foreground">
          Allowed tags: p, h2, h3, ul, ol, li, a, strong, em, br, blockquote.
        </p>
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
        Published
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
