import { useEffect, useState } from "react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    FileText,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import { api } from "../api";
import type { Post } from "../types";
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

export default function Admin() {
    const navigate = useNavigate();

    const [posts, setPosts] = useState<Post[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [message, setMessage] = useState("");
    const [deletePostId, setDeletePostId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    const [sortBy, setSortBy] = useState<
        "title" | "category" | "published" | "publishedAt"
    >("publishedAt");

    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const loadingDots = useLoadingDots();

    const POSTS_PER_PAGE = 10;

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    async function load(page = currentPage) {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        const { data } = await api.get<{
            posts: Post[];
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        }>("/api/posts", {
            params: {
                admin: true,
                page,
                pageSize: POSTS_PER_PAGE,
                sortBy,
                sortOrder,
                search,
            },
            headers,
        });

        setPosts(data.posts);
        setTotalPosts(data.total);
        setTotalPages(data.totalPages);
    }

    useEffect(() => {
        load(currentPage).catch(() => navigate("/admin/login"));
    }, [currentPage, sortBy, sortOrder, search]);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    function handleSort(
        column: "title" | "category" | "published" | "publishedAt"
    ) {
        if (sortBy === column) {
            setSortOrder((order) =>
                order === "asc" ? "desc" : "asc"
            );
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }

        setCurrentPage(1);
    }

    function SortIndicator({
        column,
    }: {
        column:
        | "title"
        | "category"
        | "published"
        | "publishedAt";
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
        setDeletePostId(id);
    }

    async function confirmDelete() {
        if (deletePostId === null) {
            return;
        }

        setDeleting(true);
        setMessage("");

        try {
            await api.delete(`/api/posts/${deletePostId}`, {
                headers,
            });

            setMessage("Post deleted.");
            setDeletePostId(null);

            if (posts.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
            } else {
                await load(currentPage);
            }
        } catch {
            setMessage("Could not delete post.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <section>
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                        CONTENT
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                        Posts
                    </h1>

                    <p className="mt-2 text-slate">
                        Create, edit and manage your blog posts.
                    </p>
                </div>
            </div>

            {/* Find + New Post */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Find posts..."
                        className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />
                </div>

                <Link
                    to="/admin/posts/new"
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    New Post
                </Link>
            </div>


            {message && (
                <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#d4a017] bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg">
                    {message}
                </div>
            )}

            {posts.length === 0 ? (
                <div className="rounded-lg bg-white px-7 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <FileText className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 font-bold text-ink">
                        {search ? "No posts found" : "No posts yet"}
                    </h2>

                    <p className="mt-1 text-sm text-slate">
                        {search
                            ? `No posts match "${search}".`
                            : "Create your first blog post to get started."}
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
                            to="/admin/posts/new"
                            className="mt-5 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-dark"
                        >
                            Create your first post
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead className="border-b border-line bg-[#e2e7f0]">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("title")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by title"
                                        >
                                            <span>Title</span>
                                            <SortIndicator column="title" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("category")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by category"
                                        >
                                            <span>Category</span>
                                            <SortIndicator column="category" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("published")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by status"
                                        >
                                            <span>Status</span>
                                            <SortIndicator column="published" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("publishedAt")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by date"
                                        >
                                            <span>Date</span>
                                            <SortIndicator column="publishedAt" />
                                        </button>
                                    </th>

                                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-line">
                                {posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="transition-colors hover:bg-surface/50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="max-w-[550px]">
                                                <p className="truncate text-sm font-semibold text-ink">
                                                    {post.title}
                                                </p>

                                                <p className="mt-1 truncate text-sm text-muted">
                                                    /{post.slug}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate">
                                            {post.category?.name ||
                                                "General"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${post.published
                                                    ? "bg-green-50 text-success"
                                                    : "bg-surface-alt text-muted"
                                                    }`}
                                            >
                                                {post.published
                                                    ? "Published"
                                                    : "Draft"}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate">
                                            {new Date(
                                                post.publishedAt ||
                                                post.createdAt
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    to={`/admin/posts/${post.id}/edit`}
                                                    title="Edit post"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(post.id)
                                                    }
                                                    title="Delete post"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted">
                            Showing{" "}
                            {/* <span className="font-semibold text-ink">
                                {(currentPage - 1) *
                                    POSTS_PER_PAGE +
                                    1}
                            </span>
                            {" - "} */}
                            <span className="font-semibold text-ink">
                                {Math.min(
                                    currentPage * POSTS_PER_PAGE,
                                    totalPosts
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-ink">
                                {totalPosts}
                            </span>{" "}
                            {/* posts */}
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
                                <span className="font-semibold">{currentPage}</span>
                                {" of "}
                                <span className="font-semibold">{totalPages}</span>
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
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

            {/* Delete dialog stays unchanged */}
            <AlertDialog
                open={deletePostId !== null}
                onOpenChange={(open: any) => {
                    if (!open && !deleting) {
                        setDeletePostId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this post?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The post will be
                            permanently deleted from your blog.
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
                                "Delete Post"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}