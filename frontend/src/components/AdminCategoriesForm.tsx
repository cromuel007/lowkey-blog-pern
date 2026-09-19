import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useLoadingDots } from "../hooks/useLoadingDots";

type Category = {
    id: number;
    name: string;
    slug: string;
    createdAt: string;
};

export default function CategoryForm() {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        if (!isEdit) {
            return;
        }

        async function loadCategory() {
            try {
                const { data } = await api.get<Category>(
                    `/api/categories/${id}`,
                    {
                        headers,
                    }
                );

                setName(data.name);
                setSlug(data.slug);
            } catch {
                navigate("/admin/categories");
            } finally {
                setLoading(false);
            }
        }

        loadCategory();
    }, [id, isEdit]);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    function handleNameChange(value: string) {
        setName(value);

        if (!isEdit) {
            const generatedSlug = value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");

            setSlug(generatedSlug);
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!name.trim()) {
            setMessage("Category name is required.");
            return;
        }

        if (!slug.trim()) {
            setMessage("Category slug is required.");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            if (isEdit) {
                await api.put(
                    `/api/categories/${id}`,
                    {
                        name: name.trim(),
                        slug: slug.trim().toLowerCase(),
                    },
                    {
                        headers,
                    }
                );

                setMessage("Category updated.");

                setTimeout(() => {
                    navigate("/admin/categories");
                }, 700);
            } else {
                await api.post(
                    "/api/categories",
                    {
                        name: name.trim(),
                        slug: slug.trim().toLowerCase(),
                    },
                    {
                        headers,
                    }
                );

                setMessage("Category created.");

                setTimeout(() => {
                    navigate("/admin/categories");
                }, 700);
            }
        } catch (error: any) {
            const responseMessage =
                error?.response?.data?.message;

            setMessage(
                responseMessage ||
                `Could not ${isEdit ? "update" : "create"} category.`
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <section>
                <div className="flex min-h-[300px] items-center justify-center">
                    <div className="text-sm font-semibold text-muted">
                        <span>Loading</span>
                        <span className="inline-block w-[18px] text-left">
                            {loadingDots}
                        </span>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section>
            {message && (
                <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#d4a017] bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg">
                    {message}
                </div>
            )}

            <div className="mb-8">
                <Link
                    to="/admin/categories"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Categories
                </Link>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    CONTENT
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    {isEdit ? "Edit Category" : "New Category"}
                </h1>

                <p className="mt-2 text-slate">
                    {isEdit
                        ? "Update your blog category."
                        : "Create a new blog category."}
                </p>
            </div>

            <div className="max-w-2xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div>
                        <label
                            htmlFor="category-name"
                            className="mb-2 block text-sm font-semibold text-ink"
                        >
                            Name
                        </label>

                        <input
                            id="category-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                handleNameChange(
                                    event.target.value
                                )
                            }
                            placeholder="e.g. Technology"
                            disabled={saving}
                            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:bg-surface"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="category-slug"
                            className="mb-2 block text-sm font-semibold text-ink"
                        >
                            Slug
                        </label>

                        <input
                            id="category-slug"
                            type="text"
                            value={slug}
                            onChange={(event) =>
                                setSlug(event.target.value)
                            }
                            placeholder="e.g. technology"
                            disabled={saving}
                            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:bg-surface"
                        />

                        <p className="mt-2 text-xs text-muted">
                            This will be used in the category URL.
                        </p>
                    </div>

                    <div className="flex items-center justify-start gap-3 border-t border-line pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="inline-flex items-center">
                                    <span>
                                        {isEdit
                                            ? "Updating"
                                            : "Creating"}
                                    </span>

                                    <span className="w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </span>
                            ) : (
                                <>

                                    {isEdit
                                        ? "Update Category"
                                        : "Create Category"}
                                </>
                            )}
                        </button>

                        <Link
                            to="/admin/categories"
                            className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </section>
    );
}