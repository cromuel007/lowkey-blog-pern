import { useEffect, useRef, useState } from "react";
import {
    X,
} from "lucide-react";
import { api } from "../api";
import type { Category, Post, Tag } from "../types";
import TiptapEditor from "./TiptapEditor";
import { useLoadingDots } from "../hooks/useLoadingDots";

export default function PostForm({
    post,
    categories,
    tags,
    headers,
    onSaved,
    onCancel,
}: {
    post: Post | null;
    categories: Category[];
    tags: Tag[];
    headers: Record<string, string>;
    onSaved: () => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [published, setPublished] = useState(false);
    const [publishedAt, setPublishedAt] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [tagIds, setTagIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState("");

    const publishedAtRef = useRef<HTMLInputElement>(null);

    const loadingDots = useLoadingDots();

    useEffect(() => {
        if (!post) {
            setTitle("");
            setSlug("");
            setExcerpt("");
            setContent("");
            setPublished(false);
            setPublishedAt("");
            setCategoryId("");
            setCoverImageUrl("");
            setSeoTitle("");
            setSeoDescription("");
            setTagIds([]);
            return;
        }

        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content);
        setPublished(post.published);

        setPublishedAt(
            post.publishedAt
                ? new Date(post.publishedAt)
                    .toISOString()
                    .slice(0, 16)
                : ""
        );

        setCategoryId(
            post.category?.id ? String(post.category.id) : ""
        );
        setCoverImageUrl(post.coverImageUrl || "");
        setSeoTitle(post.seoTitle || "");
        setSeoDescription(post.seoDescription || "");
        setTagIds(post.tags.map((x) => x.tag.id));
    }, [post]);

    function autoSlug(value: string) {
        setTitle(value);

        if (!post) {
            setSlug(
                value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
            );
        }
    }

    async function uploadCoverImage(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be smaller than 5MB.");
            e.target.value = "";
            return;
        }

        setUploadingImage(true);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const { data } = await api.post(
                "/api/posts/upload",
                formData,
                {
                    headers,
                }
            );

            setCoverImageUrl(data.url);
        } catch (error: any) {
            console.error(error);

            setError(
                error?.response?.data?.message ||
                "Could not upload cover image."
            );
        } finally {
            setUploadingImage(false);
            e.target.value = "";
        }
    }

    function removeCoverImage() {
        setCoverImageUrl("");
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (uploadingImage) {
            setError(
                "Please wait for the image upload to finish."
            );
            return;
        }

        setSaving(true);

        const payload = {
            title,
            slug,
            excerpt: excerpt || null,
            content,
            published,
            publishedAt: publishedAt
                ? new Date(publishedAt).toISOString()
                : null,
            categoryId: categoryId
                ? Number(categoryId)
                : null,
            coverImageUrl: coverImageUrl || null,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            tagIds,
        };

        try {
            if (post) {
                await api.put(
                    `/api/posts/${post.id}`,
                    payload,
                    {
                        headers,
                    }
                );
            } else {
                await api.post(
                    "/api/posts",
                    payload,
                    {
                        headers,
                    }
                );
            }

            onSaved();
        } catch (error: any) {
            console.error(error);

            setError(
                error?.response?.data?.message ||
                (post
                    ? "Could not update the post."
                    : "Could not create the post.")
            );
        } finally {
            setSaving(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

    const labelClass =
        "mb-5 block text-sm font-semibold text-ink";

    return (
        <form
            className="mb-8 rounded-lg bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8"
            onSubmit={submit}
        >
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
                    {error}
                </div>
            )}

            <div className="mb-7 border-b border-line pb-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">
                    {post ? "EDITING POST" : "NEW POST"}
                </p>

                <p className="mt-1 text-sm text-slate">
                    {post
                        ? "Update the information and content for this post."
                        : "Fill in the details below to create your post."}
                </p>
            </div>

            <div className="mb-8">
                <p className="mb-4 text-sm font-bold text-ink">
                    Basic Information
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className={labelClass}>
                        Title

                        <input
                            value={title}
                            onChange={(e) =>
                                autoSlug(e.target.value)
                            }
                            required
                            className={inputClass}
                        />
                    </label>

                    <label className={labelClass}>
                        Slug

                        <input
                            value={slug}
                            onChange={(e) =>
                                setSlug(e.target.value)
                            }
                            required
                            className={inputClass}
                        />
                    </label>
                </div>

                <label className={labelClass}>
                    Excerpt

                    <textarea
                        value={excerpt}
                        onChange={(e) =>
                            setExcerpt(e.target.value)
                        }
                        className={`${inputClass} min-h-[100px] resize-y`}
                    />
                </label>
            </div>

            <div className="mb-8">
                <p className="mb-4 text-sm font-bold text-ink">
                    Content
                </p>

                <div className={labelClass}>
                    <label className="block text-sm font-semibold text-ink">
                        Content
                    </label>

                    <div className="mt-2">
                        <TiptapEditor
                            value={content}
                            onChange={setContent}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <p className="mb-4 text-sm font-bold text-ink">
                    Publishing
                </p>

                <div className="mb-5">
                    <label className={labelClass}>
                        Category

                        <select
                            value={categoryId}
                            onChange={(e) =>
                                setCategoryId(e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">General</option>

                            {categories.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                >
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mb-5">
                    <div className={labelClass}>
                        <span className="block">
                            Cover image
                        </span>

                        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm font-semibold text-slate transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={uploadCoverImage}
                                disabled={uploadingImage || saving}
                                className="hidden"
                            />

                            {uploadingImage ? (
                                <span className="inline-flex items-center">
                                    <span>Uploading</span>

                                    <span className="w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </span>
                            ) : (
                                "Choose image"
                            )}
                        </label>

                        <p className="mt-2 text-xs font-normal text-muted">
                            JPG, PNG, GIF, WebP · Maximum 5MB
                        </p>

                        {coverImageUrl && (
                            <div className="mt-3">
                                <div className="relative overflow-hidden rounded-lg border border-line">
                                    <img
                                        src={coverImageUrl}
                                        alt="Cover preview"
                                        className="h-[310px] w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={removeCoverImage}
                                        disabled={
                                            uploadingImage || saving
                                        }
                                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <p className="mb-4 text-sm font-bold text-ink">
                    SEO
                </p>

                <label className={labelClass}>
                    SEO title

                    <input
                        value={seoTitle}
                        onChange={(e) =>
                            setSeoTitle(e.target.value)
                        }
                        className={inputClass}
                    />
                </label>

                <label className={labelClass}>
                    SEO description

                    <textarea
                        value={seoDescription}
                        onChange={(e) =>
                            setSeoDescription(e.target.value)
                        }
                        className={`${inputClass} min-h-[100px] resize-y`}
                    />
                </label>
            </div>

            <div className="mb-8">
                <p className="mb-3 text-sm font-bold text-ink">
                    Tags
                </p>

                {tags.length === 0 ? (
                    <p className="text-sm text-muted">
                        No tags available.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2.5">
                        {tags.map((t) => (
                            <label
                                key={t.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${tagIds.includes(t.id)
                                    ? "border-accent bg-accent-soft text-accent"
                                    : "border-line bg-white text-slate hover:bg-surface-alt"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={tagIds.includes(
                                        t.id
                                    )}
                                    onChange={(e) =>
                                        setTagIds(
                                            e.target.checked
                                                ? [
                                                    ...tagIds,
                                                    t.id,
                                                ]
                                                : tagIds.filter(
                                                    (id) =>
                                                        id !==
                                                        t.id
                                                )
                                        )
                                    }
                                    className="h-4 w-4 rounded border-line accent-accent"
                                />

                                {t.name}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="mb-8">
                <label className={labelClass}>
                    Published Date

                    <input
                        ref={publishedAtRef}
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) =>
                            setPublishedAt(e.target.value)
                        }
                        onClick={(e) => {
                            e.currentTarget.showPicker?.();
                        }}
                        className={inputClass}
                    />

                    <span className="mt-2 block text-xs font-normal text-muted">
                        The date and time this post is considered
                        published.
                    </span>
                </label>
            </div>

            <label className="mb-7 flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt">
                <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) =>
                        setPublished(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-line accent-accent"
                />

                <span>
                    <span className="block">
                        Published
                    </span>

                    <span className="mt-0.5 block text-xs font-normal text-muted">
                        Make this post visible on the public
                        blog.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap gap-3 border-t border-line pt-6">
                <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="btn-primary min-w-[140px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? (
                        <span className="inline-flex min-w-[82px] items-center justify-start">
                            <span>
                                {post ? "Updating" : "Creating"}
                            </span>

                            <span className="w-[18px] text-left">
                                {loadingDots}
                            </span>
                        </span>
                    ) : uploadingImage ? (
                        <span className="inline-flex min-w-[82px] items-center justify-start">
                            <span>Uploading</span>

                            <span className="w-[18px] text-left">
                                {loadingDots}
                            </span>
                        </span>
                    ) : post ? (
                        "Update Post"
                    ) : (
                        "Create Post"
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving || uploadingImage}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}