import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { SUBJECT_OPTIONS } from "@/api/notes";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];
const MAX_TAGS = 5;
const extensionOf = (name) => name.split(".").pop()?.toLowerCase() ?? "";
const parseTags = (raw) => [
  ...new Set(
    raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  ),
];
const formatBytes = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
const makeSchema = (fileRequired) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters.")
      .max(100, "Title must be 100 characters or fewer."),
    subject: z.string().refine((v) => SUBJECT_OPTIONS.includes(v), "Please select a subject."),
    semester: z.string().refine((v) => /^[1-8]$/.test(v), "Please select a semester."),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters.")
      .max(500, "Description must be 500 characters or fewer."),
    tags: z
      .string()
      .refine((v) => parseTags(v).length > 0, "Add at least one tag, separated by commas.")
      .refine((v) => parseTags(v).length <= MAX_TAGS, `Use at most ${MAX_TAGS} tags.`)
      .refine(
        (v) => parseTags(v).every((t) => t.length <= 20),
        "Each tag must be 20 characters or fewer.",
      ),
    file: z
      .custom()
      .refine((f) => !fileRequired || Boolean(f instanceof File), "Please choose a file to upload.")
      .refine(
        (f) =>
          !(f instanceof File) ||
          (ALLOWED_EXTENSIONS.includes(extensionOf(f.name)) &&
            (f.type === "" || ALLOWED_MIME_TYPES.includes(f.type))),
        `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`,
      )
      .refine(
        (f) => !(f instanceof File) || f.size <= MAX_FILE_SIZE,
        `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`,
      )
      .refine((f) => !(f instanceof File) || f.size > 0, "File is empty."),
  });
export function NoteForm({
  mode,
  defaultValues,
  existingFileHint,
  onSubmit,
  onCancel,
  idPrefix = "",
}) {
  const [fileKey, setFileKey] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(makeSchema(mode === "create")),
    mode: "onTouched",
    defaultValues: {
      title: "",
      subject: "",
      semester: "",
      description: "",
      tags: "",
      file: null,
      ...defaultValues,
    },
  });
  const description = watch("description");
  const selectedFile = watch("file");
  const submit = async (values) => {
    try {
      await onSubmit({
        title: values.title.trim(),
        subject: values.subject,
        semester: Number(values.semester),
        description: values.description.trim(),
        tags: parseTags(values.tags),
        file: values.file,
      });
      if (mode === "create") {
        reset();
        setFileKey((k) => k + 1); // remount the file input so it clears
      }
    } catch {
      // The caller shows its own error toast; keep the form filled in so nothing is lost.
    }
  };
  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring ${hasError ? "border-destructive" : "border-input"}`;
  const fieldError = (id, message) =>
    message ? (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
        {message}
      </p>
    ) : null;
  const labelClass = "mb-1 block text-sm font-medium text-foreground";
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor={`${idPrefix}title`} className={labelClass}>
          Title
        </label>
        <input
          id={`${idPrefix}title`}
          type="text"
          placeholder="e.g. Data Structures — Complete Notes"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${idPrefix}title-error` : undefined}
          className={inputClass(errors.title)}
          {...register("title")}
        />
        {fieldError(`${idPrefix}title`, errors.title?.message)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}subject`} className={labelClass}>
            Subject
          </label>
          <select
            id={`${idPrefix}subject`}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? `${idPrefix}subject-error` : undefined}
            className={inputClass(errors.subject)}
            {...register("subject")}
          >
            <option value="">Select a subject…</option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldError(`${idPrefix}subject`, errors.subject?.message)}
        </div>

        <div>
          <label htmlFor={`${idPrefix}semester`} className={labelClass}>
            Semester
          </label>
          <select
            id={`${idPrefix}semester`}
            aria-invalid={!!errors.semester}
            aria-describedby={errors.semester ? `${idPrefix}semester-error` : undefined}
            className={inputClass(errors.semester)}
            {...register("semester")}
          >
            <option value="">Select a semester…</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                Semester {n}
              </option>
            ))}
          </select>
          {fieldError(`${idPrefix}semester`, errors.semester?.message)}
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}description`} className={labelClass}>
          Description
        </label>
        <textarea
          id={`${idPrefix}description`}
          rows={4}
          placeholder="What topics do these notes cover?"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? `${idPrefix}description-error` : undefined}
          className={inputClass(errors.description)}
          {...register("description")}
        />
        <div className="flex justify-between">
          <div>{fieldError(`${idPrefix}description`, errors.description?.message)}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description.length}/500</p>
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}tags`} className={labelClass}>
          Tags
        </label>
        <input
          id={`${idPrefix}tags`}
          type="text"
          placeholder="dsa, algorithms, exam-prep"
          aria-invalid={!!errors.tags}
          aria-describedby={errors.tags ? `${idPrefix}tags-error` : `${idPrefix}tags-hint`}
          className={inputClass(errors.tags)}
          {...register("tags")}
        />
        {errors.tags ? (
          fieldError(`${idPrefix}tags`, errors.tags.message)
        ) : (
          <p id={`${idPrefix}tags-hint`} className="mt-1 text-xs text-muted-foreground">
            Separate with commas. Up to {MAX_TAGS} tags.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}file`} className={labelClass}>
          File
        </label>
        <input
          key={fileKey}
          id={`${idPrefix}file`}
          type="file"
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          aria-invalid={!!errors.file}
          aria-describedby={errors.file ? `${idPrefix}file-error` : `${idPrefix}file-hint`}
          onChange={(e) =>
            setValue("file", e.target.files?.[0] ?? null, {
              shouldValidate: true,
              shouldTouch: true,
            })
          }
          className={`${inputClass(errors.file)} file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground`}
        />
        {errors.file ? (
          fieldError(`${idPrefix}file`, errors.file.message)
        ) : (
          <p id={`${idPrefix}file-hint`} className="mt-1 text-xs text-muted-foreground">
            {selectedFile instanceof File
              ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
              : mode === "edit" && existingFileHint
                ? `${existingFileHint} Choose a file only to replace it.`
                : `${ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")} — up to ${formatBytes(MAX_FILE_SIZE)}.`}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create"
            ? isSubmitting
              ? "Uploading…"
              : "Upload notes"
            : isSubmitting
              ? "Saving…"
              : "Save changes"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-input px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
