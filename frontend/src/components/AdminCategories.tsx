import { useEffect, useState } from "react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Folder,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./AlertDialog";
import { useLoadingDots } from "../hooks/useLoadingDots";

type Category = {
    id: number;
    name: string;
    slug: string;
    createdAt: string;
    _count: {
        posts: number;
    };
};

type SortColumn = "name" | "slug" | "posts" | "createdAt";

export default function Categories() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [message, setMessage] = useState("");
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(
        null
    );
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const [sortBy, setSortBy] = useState<SortColumn>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    async function load() {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        const { data } = await api.get<Category[]>("/api/categories", {
            headers,
        });

        setCategories(data);
    }

    useEffect(() => {
        load().catch(() => navigate("/admin/login"));
    }, []);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    function handleSort(column: SortColumn) {
        if (sortBy === column) {
            setSortOrder((order) =>
                order === "asc" ? "desc" : "asc"
            );
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    }

    function SortIndicator({
        column,
    }: {
        column: SortColumn;
    }) {
        if (sortBy !== column) {
            return (
                <span className="text-muted/50">
                    ↕
                </span>
            );
        }

        return (
            <span className="font-bold text-accent">
                {sortOrder === "asc" ? "↑" : "↓"}
            </span>
        );
    }

    function remove(id: number) {
        setDeleteCategoryId(id);
    }

    async function confirmDelete() {
        if (deleteCategoryId === null) {
            return;
        }

        setDeleting(true);
        setMessage("");

        try {
            await api.delete(`/api/categories/${deleteCategoryId}`, {
                headers,
            });

            setMessage("Category deleted.");
            setDeleteCategoryId(null);

            await load();
        } catch (error: any) {
            const responseMessage =
                error?.response?.data?.message;

            setMessage(
                responseMessage || "Could not delete category."
            );
        } finally {
            setDeleting(false);
        }
    }

    const filteredCategories = categories.filter((category) => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return (
            category.name.toLowerCase().includes(query) ||
            category.slug.toLowerCase().includes(query)
        );
    });

    const sortedCategories = [...filteredCategories].sort(
        (a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;

                case "slug":
                    comparison = a.slug.localeCompare(b.slug);
                    break;

                case "posts":
                    comparison =
                        a._count.posts - b._count.posts;
                    break;

                case "createdAt":
                    comparison =
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime();
                    break;
            }

            return sortOrder === "asc"
                ? comparison
                : -comparison;
        }
    );

    const CATEGORIES_PER_PAGE = 10;

    const totalCategories = sortedCategories.length;
    const totalPages = Math.max(
        1,
        Math.ceil(totalCategories / CATEGORIES_PER_PAGE)
    );

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortBy, sortOrder]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedCategories = sortedCategories.slice(
        (currentPage - 1) * CATEGORIES_PER_PAGE,
        currentPage * CATEGORIES_PER_PAGE
    );

    return (
        <section>
            {message && (
                <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#d4a017] bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg">
                    {message}
                </div>
            )}

            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                        CONTENT
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                        Categories
                    </h1>

                    <p className="mt-2 text-slate">
                        Create, edit and manage your blog categories.
                    </p>
                </div>
            </div>

            {/* Find + New Category */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        placeholder="Find categories..."
                        className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />
                </div>

                <Link
                    to="/admin/categories/new"
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    New Category
                </Link>
            </div>

            {paginatedCategories.length === 0 ? (
                <div className="rounded-lg bg-white px-7 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <Folder className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 font-bold text-ink">
                        {search
                            ? "No categories found"
                            : "No categories yet"}
                    </h2>

                    <p className="mt-1 text-sm text-slate">
                        {search
                            ? `No categories match "${search}".`
                            : "Create your first category to get started."}
                    </p>

                    {search ? (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="mt-5 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-dark"
                        >
                            Clear search
                        </button>
                    ) : (
                        <Link
                            to="/admin/categories/new"
                            className="mt-5 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-dark"
                        >
                            Create your first category
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead className="border-b border-line bg-[#e2e7f0]">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("name")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by name"
                                        >
                                            <span>Name</span>
                                            <SortIndicator column="name" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("slug")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by slug"
                                        >
                                            <span>Slug</span>
                                            <SortIndicator column="slug" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("posts")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by posts"
                                        >
                                            <span>Posts</span>
                                            <SortIndicator column="posts" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("createdAt")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by date"
                                        >
                                            <span>Date</span>
                                            <SortIndicator column="createdAt" />
                                        </button>
                                    </th>

                                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-line">
                                {paginatedCategories.map(
                                    (category) => (
                                        <tr
                                            key={category.id}
                                            className="transition-colors hover:bg-surface/50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-ink">
                                                    {category.name}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-sm text-muted">
                                                    /{category.slug}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                                                    {category._count.posts}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate">
                                                {new Date(
                                                    category.createdAt
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/admin/categories/${category.id}/edit`}
                                                        title="Edit category"
                                                        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(
                                                                category.id
                                                            )
                                                        }
                                                        title={
                                                            category
                                                                ._count
                                                                .posts >
                                                                0
                                                                ? "Cannot delete category with posts"
                                                                : "Delete category"
                                                        }
                                                        disabled={
                                                            category
                                                                ._count
                                                                .posts >
                                                            0
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted">
                            Showing{" "}
                            <span className="font-semibold text-ink">
                                {Math.min(
                                    currentPage *
                                    CATEGORIES_PER_PAGE,
                                    totalCategories
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-ink">
                                {totalCategories}
                            </span>
                        </p>

                        <div className="flex items-center gap-0">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="inline-flex items-center gap-0 rounded-lg border border-transparent bg-white px-1 py-1 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                                title="Previous"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="px-1 text-xs text-slate">
                                {" Page "}
                                <span className="font-semibold">
                                    {currentPage}
                                </span>
                                {" of "}
                                <span className="font-semibold">
                                    {totalPages}
                                </span>
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(
                                            totalPages,
                                            page + 1
                                        )
                                    )
                                }
                                disabled={
                                    currentPage === totalPages
                                }
                                className="inline-flex items-center gap-0 rounded-lg border border-transparent bg-white px-1 py-1 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                                title="Next"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-12" />

            {/* Delete dialog */}
            <AlertDialog
                open={deleteCategoryId !== null}
                onOpenChange={(open: boolean) => {
                    if (!open && !deleting) {
                        setDeleteCategoryId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this category?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The category
                            will be permanently deleted from your blog.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-danger text-white hover:bg-danger/90"
                        >
                            {deleting ? (
                                <span className="inline-flex items-center">
                                    <span>Deleting</span>
                                    <span className="w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </span>
                            ) : (
                                "Delete Category"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}