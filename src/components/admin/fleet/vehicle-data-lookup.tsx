"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VehicleImportPayload } from "@/lib/vehicle-data/import-payload";
import { buildSuggestionDetail } from "@/lib/vehicle-data/normalize";
import type { VehicleDataSuggestion } from "@/lib/vehicle-data/types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type Status = "idle" | "loading" | "ready" | "empty" | "error";

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function VehicleDataLookup({
  onImport,
  disabled = false,
}: {
  onImport: (payload: VehicleImportPayload) => void;
  disabled?: boolean;
}) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const statusId = `${baseId}-status`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleDataSuggestion[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [importing, setImporting] = useState<string | null>(null);

  const searchAbort = useRef<AbortController | null>(null);
  const importAbort = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      searchAbort.current?.abort();
      importAbort.current?.abort();
    };
  }, []);

  function handleQueryChange(next: string) {
    setQuery(next);

    // Clearing the box back below the minimum resets the panel here rather
    // than in the effect, so no render is scheduled just to undo state.
    if (next.trim().length < MIN_QUERY_LENGTH) {
      searchAbort.current?.abort();
      setResults([]);
      setActiveIndex(-1);
      setStatus("idle");
      setMessage("");
      setOpen(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    const timer = setTimeout(() => {
      // Abort the previous request so a slow earlier keystroke cannot
      // overwrite the results for what the user is typing now.
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;

      setStatus("loading");
      setMessage("Searching the vehicle database…");

      fetch(
        `/api/admin/vehicle-data/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(
              await readError(
                response,
                "Vehicle data lookup is temporarily unavailable. You can continue entering the vehicle manually.",
              ),
            );
          }

          return (await response.json()) as { results: VehicleDataSuggestion[] };
        })
        .then((body) => {
          if (controller.signal.aborted) {
            return;
          }

          setResults(body.results);
          setActiveIndex(body.results.length > 0 ? 0 : -1);
          setOpen(true);
          setStatus(body.results.length > 0 ? "ready" : "empty");
          setMessage(
            body.results.length > 0
              ? `${body.results.length} vehicle${body.results.length === 1 ? "" : "s"} found.`
              : "No matching vehicles. You can enter this vehicle manually.",
          );
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          setResults([]);
          setActiveIndex(-1);
          setOpen(false);
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Vehicle data lookup is temporarily unavailable. You can continue entering the vehicle manually.",
          );
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  async function selectSuggestion(suggestion: VehicleDataSuggestion) {
    importAbort.current?.abort();
    const controller = new AbortController();
    importAbort.current = controller;

    setOpen(false);
    setImporting(suggestion.providerId);
    setStatus("loading");
    setMessage(`Loading details for ${suggestion.label}…`);

    const path = suggestion.providerId
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    try {
      const response = await fetch(`/api/admin/vehicle-data/vehicle/${path}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            "That vehicle could not be loaded. You can continue entering it manually.",
          ),
        );
      }

      const payload = (await response.json()) as VehicleImportPayload;
      onImport(payload);
      setQuery("");
      setResults([]);
      setStatus("idle");
      setMessage(`Loaded ${payload.label}. Review the details before saving.`);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "That vehicle could not be loaded. You can continue entering it manually.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setImporting(null);
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) {
        return;
      }

      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = current + step;
        if (next < 0) {
          return results.length - 1;
        }
        return next >= results.length ? 0 : next;
      });
      return;
    }

    if (event.key === "Enter") {
      const active = open ? results[activeIndex] : undefined;
      if (active) {
        // Stop the surrounding model form from submitting on Enter.
        event.preventDefault();
        void selectSuggestion(active);
      }
    }
  }

  const busy = status === "loading";
  const activeOptionId =
    open && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  return (
    <div
      ref={containerRef}
      className="space-y-1.5"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <Label htmlFor={`${baseId}-input`}>Search the vehicle database</Label>
      <div className="relative">
        <Input
          id={`${baseId}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search make, model or year..."
          disabled={disabled || importing !== null}
          value={query}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-describedby={statusId}
          aria-busy={busy}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
        />

        <ul
          id={listboxId}
          role="listbox"
          aria-label="Vehicle database results"
          hidden={!open || results.length === 0}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-input bg-background py-1 shadow-lg"
        >
          {results.map((suggestion, index) => {
            const detail = buildSuggestionDetail([
              suggestion.bodyType,
              suggestion.fuelType,
              suggestion.trim,
            ]);

            return (
              <li
                key={suggestion.providerId}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectSuggestion(suggestion)}
              >
                <span className="block font-medium">{suggestion.label}</span>
                {detail ? (
                  <span
                    className={`block text-xs ${
                      index === activeIndex ? "opacity-90" : "text-muted-foreground"
                    }`}
                  >
                    {detail}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {message ||
          `Type at least ${MIN_QUERY_LENGTH} characters to search, or enter the vehicle manually below.`}
      </p>
    </div>
  );
}
