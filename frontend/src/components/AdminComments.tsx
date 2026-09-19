import { useEffect, useState } from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    MessageSquare,
    Search,
    ThumbsUp,
    Trash2,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

type PostComment = {
    id: number;
    author: string;
    content: string;
    likeCount: number;
    is_approved: boolean;
    approval_token: string | null;
    createdAt: string;
    post: {
        id: number;
        title: string;
        slug: string;
    };
    parent?: {
        id: number;
        author: string;
    } | null;
};

type CommentSortColumn =
    | "post"
    | "author"
    | "likeCount"
    | "is_approved"
    | "createdAt";

export default function Comments() {
    const navigate = useNavigate();

    const [comments, setComments] = useState<PostComment[]>([]);
    const [totalComments, setTotalComments] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState("");

    const [deleteCommentId, setDeleteCommentId] =
        useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [approveCommentId, setApproveCommentId] =
        useState<number | null>(null);
    const [approving, setApproving] = useState(false);

    const [sortBy, setSortBy] =
        useState<CommentSortColumn>("createdAt");

    const [sortOrder, setSortOrder] =
        useState<"asc" | "desc">("desc");

    const loadingDots = useLoadingDots();

    const COMMENTS_PER_PAGE = 10;

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
            comments: PostComment[];
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        }>("/api/posts/comments", {
            params: {
                admin: true,
                page,
                pageSize: COMMENTS_PER_PAGE,
                search,
                sortBy,
                sortOrder,
            },
            headers,
        });

        setComments(data.comments);
        setTotalComments(data.total);
        setTotalPages(data.totalPages);
    }

    useEffect(() => {
        load(currentPage).catch(() =>
            navigate("/admin/login")
        );
    }, [currentPage, sortBy, sortOrder, search]);

    function handleSort(column: CommentSortColumn) {
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
        column: CommentSortColumn;
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
        setDeleteCommentId(id);
    }

    function approve(id: number) {
        setApproveCommentId(id);
    }

    async function confirmApprove() {
        if (approveCommentId === null) {
            return;
        }

        const comment = comments.find(
            (comment) => comment.id === approveCommentId
        );

        if (!comment?.approval_token) {
            setMessage("Could not approve comment.");
            setApproveCommentId(null);
            return;
        }

        setApproving(true);
        setMessage("");

        try {
            await api.get(
                `/api/posts/comments/approve/${comment.approval_token}`
            );

            setMessage("Comment approved.");
            setApproveCommentId(null);

            await load(currentPage);
        } catch {
            setMessage("Could not approve comment.");
        } finally {
            setApproving(false);
        }
    }

    async function confirmDelete() {
        if (deleteCommentId === null) {
            return;
        }

        setDeleting(true);
        setMessage("");

        try {
            await api.delete(
                `/api/posts/comments/${deleteCommentId}`,
                {
                    headers,
                }
            );

            setMessage("Comment deleted.");
            setDeleteCommentId(null);

            if (
                comments.length === 1 &&
                currentPage > 1
            ) {
                setCurrentPage((page) => page - 1);
            } else {
                await load(currentPage);
            }
        } catch {
            setMessage("Could not delete comment.");
        } finally {
            setDeleting(false);
        }
    }

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    return (
        <section>
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                        CONTENT
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                        Comments
                    </h1>

                    <p className="mt-2 text-slate">
                        Review and manage comments on your blog posts.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Find comments..."
                        className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />
                </div>
            </div>

            {message && (
                <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#d4a017] bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg">
                    {message}
                </div>
            )}

            {comments.length === 0 ? (
                <div className="rounded-lg bg-white px-7 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <MessageCircle className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 font-bold text-ink">
                        {search
                            ? "No comments found"
                            : "No comments yet"}
                    </h2>

                    <p className="mt-1 text-sm text-slate">
                        {search
                            ? `No comments match "${search}".`
                            : "Comments from your blog posts will appear here."}
                    </p>

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="mt-5 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-dark"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left">
                            <thead className="border-b border-line bg-[#e2e7f0]">
                                <tr>
                                    {/* Post */}
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("post")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by post"
                                        >
                                            <span>Post</span>
                                            <SortIndicator column="post" />
                                        </button>
                                    </th>

                                    {/* Comment */}
                                    <th className="px-6 py-4 text-sm font-bold tracking-wide">
                                        Comment
                                    </th>

                                    {/* Author */}
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("author")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by author"
                                        >
                                            <span>Author</span>
                                            <SortIndicator column="author" />
                                        </button>
                                    </th>

                                    {/* Likes */}
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("likeCount")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by likes"
                                        >
                                            <span>Likes</span>
                                            <SortIndicator column="likeCount" />
                                        </button>
                                    </th>

                                    {/* Status */}
                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("is_approved")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by status"
                                        >
                                            <span>Status</span>
                                            <SortIndicator column="is_approved" />
                                        </button>
                                    </th>

                                    {/* Date */}
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

                                    {/* Actions */}
                                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-line">
                                {comments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="transition-colors hover:bg-surface/50"
                                    >
                                        {/* Post */}
                                        <td className="px-6 py-4">
                                            <div className="max-w-[200px]">
                                                <p className="truncate text-sm font-semibold text-ink">
                                                    {comment.post.title}
                                                </p>

                                                <p className="mt-1 truncate text-xs text-muted">
                                                    /{comment.post.slug}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Comment */}
                                        <td className="px-6 py-4">
                                            <div className="max-w-[220px]">
                                                {comment.parent && (
                                                    <p className="mb-1 text-xs font-semibold text-accent">
                                                        Reply to{" "}
                                                        {comment.parent.author}
                                                    </p>
                                                )}

                                                <p className="line-clamp-3 text-sm text-slate">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Author */}
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-ink">
                                                {comment.author}
                                            </p>
                                        </td>

                                        {/* Likes */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-slate">
                                                {comment.likeCount}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {comment.is_approved ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                                                    <X className="h-3.5 w-3.5" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate">
                                            {new Date(
                                                comment.createdAt
                                            ).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        approve(comment.id)
                                                    }
                                                    disabled={
                                                        comment.is_approved ||
                                                        !comment.approval_token
                                                    }
                                                    title={
                                                        comment.is_approved
                                                            ? "Comment already approved"
                                                            : "Approve comment"
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
                                                >
                                                    <ThumbsUp className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(comment.id)
                                                    }
                                                    title="Delete comment"
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
                                {Math.min(
                                    currentPage *
                                    COMMENTS_PER_PAGE,
                                    totalComments
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-ink">
                                {totalComments}
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
                open={deleteCommentId !== null}
                onOpenChange={(open: boolean) => {
                    if (!open && !deleting) {
                        setDeleteCommentId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this comment?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The comment and
                            its associated data will be permanently deleted.
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
                                "Delete Comment"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approve dialog */}
            <AlertDialog
                open={approveCommentId !== null}
                onOpenChange={(open: boolean) => {
                    if (!open && !approving) {
                        setApproveCommentId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Approve this comment?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This comment will be approved and made visible
                            on your blog.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={approving}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={confirmApprove}
                            disabled={approving}
                            className="bg-accent text-white hover:bg-accent/90"
                        >
                            {approving ? (
                                <span className="inline-flex items-center">
                                    <span>Approving</span>

                                    <span className="w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </span>
                            ) : (
                                "Approve Comment"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}