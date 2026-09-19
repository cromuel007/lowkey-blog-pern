import { useEffect, useState } from "react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Layers,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
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

type Admin = {
    id: number;
    email: string;
    createdAt: string;
    updatedAt: string;
};

type SortColumn = "email" | "createdAt" | "updatedAt";

export default function Usersx() {
    const navigate = useNavigate();

    const [admins, setAdmins] = useState<Admin[]>([]);
    const [message, setMessage] = useState("");
    const [deleteAdminId, setDeleteAdminId] = useState<number | null>(
        null
    );
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const [sortBy, setSortBy] = useState<SortColumn>("email");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const [currentPage, setCurrentPage] = useState(1);

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

        const { data } = await api.get<Admin[]>("/api/admins", {
            headers,
        });

        setAdmins(data);
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
        setDeleteAdminId(id);
    }

    async function confirmDelete() {
        if (deleteAdminId === null) {
            return;
        }

        setDeleting(true);
        setMessage("");

        try {
            await api.delete(`/api/admins/${deleteAdminId}`, {
                headers,
            });

            setMessage("Admin deleted.");
            setDeleteAdminId(null);

            await load();
        } catch (error: any) {
            const responseMessage =
                error?.response?.data?.message;

            setMessage(
                responseMessage || "Could not delete admin."
            );
        } finally {
            setDeleting(false);
        }
    }

    const filteredAdmins = admins.filter((admin) => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return admin.email.toLowerCase().includes(query);
    });

    const sortedAdmins = [...filteredAdmins].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case "email":
                comparison = a.email.localeCompare(b.email);
                break;

            case "createdAt":
                comparison =
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime();
                break;

            case "updatedAt":
                comparison =
                    new Date(a.updatedAt).getTime() -
                    new Date(b.updatedAt).getTime();
                break;
        }

        return sortOrder === "asc"
            ? comparison
            : -comparison;
    });

    const ADMINS_PER_PAGE = 10;

    const totalAdmins = sortedAdmins.length;
    const totalPages = Math.max(
        1,
        Math.ceil(totalAdmins / ADMINS_PER_PAGE)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortBy, sortOrder]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedAdmins = sortedAdmins.slice(
        (currentPage - 1) * ADMINS_PER_PAGE,
        currentPage * ADMINS_PER_PAGE
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
                        ADMINISTRATION
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                        User Admins
                    </h1>

                    <p className="mt-2 text-slate">
                        Create, edit and manage your admin users.
                    </p>
                </div>
            </div>

            {/* Find + New User */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        placeholder="Find users..."
                        className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />
                </div>

                <Link
                    to="/admin/users/new"
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    New User
                </Link>
            </div>

            {paginatedAdmins.length === 0 ? (
                <div className="rounded-lg bg-white px-7 py-12 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <Users className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 font-bold text-ink">
                        {search
                            ? "No users found"
                            : "No users yet"}
                    </h2>

                    <p className="mt-1 text-sm text-slate">
                        {search
                            ? `No users match "${search}".`
                            : "Create your first admin user to get started."}
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
                            to="/admin/users/new"
                            className="mt-5 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-dark"
                        >
                            Create your first user
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
                                                handleSort("email")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by email"
                                        >
                                            <span>Email</span>
                                            <SortIndicator column="email" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("createdAt")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by created date"
                                        >
                                            <span>Created</span>
                                            <SortIndicator column="createdAt" />
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSort("updatedAt")
                                            }
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                                            title="Sort by updated date"
                                        >
                                            <span>Updated</span>
                                            <SortIndicator column="updatedAt" />
                                        </button>
                                    </th>

                                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-line">
                                {paginatedAdmins.map((admin) => (
                                    <tr
                                        key={admin.id}
                                        className="transition-colors hover:bg-surface/50"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-ink">
                                                {admin.email}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate">
                                            {new Date(
                                                admin.createdAt
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate">
                                            {new Date(
                                                admin.updatedAt
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    to={`/admin/users/${admin.id}/edit`}
                                                    title="Edit user"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(admin.id)
                                                    }
                                                    title="Delete user"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-50"
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
                                {totalAdmins === 0
                                    ? 0
                                    : Math.min(
                                        currentPage *
                                        ADMINS_PER_PAGE,
                                        totalAdmins
                                    )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-ink">
                                {totalAdmins}
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
                open={deleteAdminId !== null}
                onOpenChange={(open: boolean) => {
                    if (!open && !deleting) {
                        setDeleteAdminId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this user?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The admin
                            user will be permanently deleted.
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
                                "Delete User"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}