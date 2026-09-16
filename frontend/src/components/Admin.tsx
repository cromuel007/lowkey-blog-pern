import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    FileText,
    LayoutDashboard,
    LogOut,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import {
    Link,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import { api } from "../api";
import type { Category, Post, Tag } from "../types";
import TiptapEditor from "./TiptapEditor";
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
import { getAsset } from "../utils/useAssets";
import { useLoadingDots } from "../hooks/useLoadingDots";

export function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navigate = useNavigate();
    const location = useLocation();

    function logout() {
        localStorage.removeItem("blog_token");
        navigate("/admin/login");
    }

    const isDashboard = location.pathname === "/admin";
    const isPosts = location.pathname.startsWith("/admin/posts");

    return (
        <div className="min-h-screen bg-surface">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:flex lg:flex-col">
                <div className="flex h-[72px] items-center border-b border-line px-6">
                    <img
                        src={getAsset("globe.png")}
                        alt="world duh"
                        className="h-8 w-8 object-contain"
                    />

                    <Link
                        to="/admin"
                        className="pl-1 text-xl font-extrabold tracking-tight text-ink transition-colors hover:text-accent"
                    >
                        TubbyLab
                    </Link>
                </div>

                <div className="flex-1 px-4 py-6">
                    <p className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
                        Administration
                    </p>

                    <nav className="space-y-1.5">
                        <Link
                            to="/admin"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isDashboard
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <Link
                            to="/admin/posts"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isPosts
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Posts
                        </Link>
                    </nav>
                </div>

                <div className="border-t border-line p-4">
                    <Link
                        to="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate transition-colors hover:bg-surface-alt hover:text-ink"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Blog
                    </Link>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger transition-colors hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4" />
                        Log out
                    </button>
                </div>
            </aside>

            <div className="lg:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur lg:hidden">
                    <div className="flex h-[68px] items-center justify-between px-4">
                        <Link
                            to="/admin"
                            className="text-xl font-extrabold tracking-tight text-ink"
                        >
                            TubbyLab
                        </Link>

                        <button
                            type="button"
                            onClick={logout}
                            className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>

                    <nav className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-line px-4 py-2">
                        <Link
                            to="/admin"
                            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isDashboard
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <Link
                            to="/admin/posts"
                            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isPosts
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Posts
                        </Link>

                        <Link
                            to="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate transition-colors hover:bg-surface-alt hover:text-ink"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Blog
                        </Link>
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const loadingDots = useLoadingDots();

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/api/auth/login", {
                email,
                password,
            });

            localStorage.setItem("blog_token", data.token);
            navigate("/admin");
        } catch {
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4">
            <div className="w-full max-w-[440px]">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center -ml-4">
                        <img
                            src={getAsset("globe.png")}
                            alt="world duh"
                            className="h-8 w-8 object-contain"
                        />

                        <Link
                            to="/"
                            className="pl-1 text-xl font-extrabold tracking-tight text-ink transition-colors hover:text-accent"
                        >
                            TubbyLab
                        </Link>
                    </div>

                    <p className="mt-2 text-sm text-muted">
                        Blog Administration
                    </p>
                </div>

                <form
                    className="rounded-lg bg-white px-7 py-8 shadow-sm sm:px-8"
                    onSubmit={submit}
                >
                    <div className="mb-7">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                            ADMINISTRATION
                        </p>

                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
                            Welcome back
                        </h1>

                        <p className="mt-2 text-slate">
                            Sign in to manage your TubbyLab blog.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
                            {error}
                        </div>
                    )}

                    <label className="mb-4 block text-sm font-semibold text-ink">
                        Email

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            autoComplete="email"
                            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                    </label>

                    <label className="mb-5 block text-sm font-semibold text-ink">
                        Password

                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            autoComplete="current-password"
                            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="relative inline-flex">
                                <span>Signing in</span>
                                <span className="w-[18px] text-left">
                                    {loadingDots}
                                </span>
                            </span>
                        ) : (
                            "Sign in"
                        )}
                    </button>

                    <div className="mt-6 border-t border-line pt-5 text-center">
                        <Link
                            to="/"
                            className="read-article-link inline-flex items-center gap-1 font-bold"
                        >
                            <ArrowLeft className="mt-0.5 h-4 w-4" />
                            Back to blogs
                        </Link>
                    </div>
                </form>

                <p className="mt-6 text-center text-xs text-muted">
                    © {new Date().getFullYear()}{" "}
                    <a
                        href="https://tubbylab.com"
                        rel="noopener noreferrer"
                        className="foot-link"
                    >
                        Cromuel
                    </a>{" "}
                    🍆. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export function AdminDashboard() {
    return (
        <section>
            <div className="mb-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    ADMINISTRATION
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    Dashboard
                </h1>

                <p className="mt-2 text-slate">
                    Manage your TubbyLab blog from one place.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-white px-7 py-8 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <FileText className="h-5 w-5" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-ink">
                        Blog Posts
                    </h2>

                    <p className="mt-2 min-h-[56px] leading-7 text-slate">
                        Create, edit, publish and manage your blog content.
                    </p>

                    <Link
                        to="/admin/posts"
                        className="btn-primary mt-6"
                    >
                        Manage Posts
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="rounded-lg bg-white px-7 py-8 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-slate">
                        <ExternalLink className="h-5 w-5" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-ink">
                        Public Blog
                    </h2>

                    <p className="mt-2 min-h-[56px] leading-7 text-slate">
                        View the public-facing TubbyLab blog and see your
                        published content.
                    </p>

                    <Link
                        to="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                        View Blog
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function Admin() {
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
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
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

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
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

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
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

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
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

                                    <th className="px-4 py-4 text-center text-xs font-bold tracking-wide">
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
                                                <p className="truncate font-semibold text-ink">
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
                            <span className="font-semibold text-ink">
                                {(currentPage - 1) *
                                    POSTS_PER_PAGE +
                                    1}
                            </span>
                            {" - "}
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
                            posts
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(1, page - 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                                title="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="px-2 text-xs font-semibold text-slate">
                                {currentPage} of {totalPages}
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
                                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                                title="Next page"
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

export function AdminPostNew() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        async function loadMeta() {
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const [c, t] = await Promise.all([
                    api.get<Category[]>("/api/meta/categories"),
                    api.get<Tag[]>("/api/meta/tags"),
                ]);

                setCategories(c.data);
                setTags(t.data);
            } catch {
                navigate("/admin/login");
            } finally {
                setLoading(false);
            }
        }

        loadMeta();
    }, []);

    if (!token || loading) {
        return (
            <p className="py-10 text-center text-slate">
                Loading
                <span className="inline-block w-[18px] text-left">
                    {loadingDots}
                </span>
            </p>
        );
    }

    return (
        <section>
            <div className="mb-8">
                <Link
                    to="/admin/posts"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </Link>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    CONTENT
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    New Post
                </h1>

                <p className="mt-2 text-slate">
                    Create a new blog post.
                </p>
            </div>

            <PostForm
                post={null}
                categories={categories}
                tags={tags}
                headers={headers}
                onSaved={() => navigate("/admin/posts")}
                onCancel={() => navigate("/admin/posts")}
            />
        </section>
    );
}

export function AdminPostEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [post, setPost] = useState<Post | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        async function load() {
            if (!token) {
                navigate("/admin/login");
                return;
            }

            if (!id) {
                setError("Post not found.");
                setLoading(false);
                return;
            }

            try {
                const [
                    postResponse,
                    categoriesResponse,
                    tagsResponse,
                ] = await Promise.all([
                    api.get<Post>(`/api/posts/${id}`, {
                        headers,
                    }),
                    api.get<Category[]>("/api/meta/categories"),
                    api.get<Tag[]>("/api/meta/tags"),
                ]);

                setPost(postResponse.data);
                setCategories(categoriesResponse.data);
                setTags(tagsResponse.data);
            } catch {
                setError("Could not load post.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    if (!token || loading) {
        return (
            <p className="py-10 text-center text-slate">
                Loading
                <span className="inline-block w-[18px] text-left">
                    {loadingDots}
                </span>
            </p>
        );
    }

    if (error || !post) {
        return (
            <section>
                <Link
                    to="/admin/posts"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </Link>

                <div className="mt-8 rounded-lg border border-red-100 bg-red-50 p-7 text-center">
                    <p className="font-medium text-danger">
                        {error || "Post not found."}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="mb-8">
                <Link
                    to="/admin/posts"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </Link>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    CONTENT
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    Edit Post
                </h1>

                <p className="mt-2 text-slate">
                    Update your blog post.
                </p>
            </div>

            <PostForm
                post={post}
                categories={categories}
                tags={tags}
                headers={headers}
                onSaved={() => navigate("/admin/posts")}
                onCancel={() => navigate("/admin/posts")}
            />
        </section>
    );
}

function PostForm({
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