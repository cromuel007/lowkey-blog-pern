import {
    ExternalLink,
    FileText,
    Layers,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Tags,
    Users,
} from "lucide-react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { getAsset } from "../utils/useAssets";

export default function AdminLayout({
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
    const isComments = location.pathname.startsWith("/admin/comments");
    const isCategories = location.pathname.startsWith("/admin/categories");
    const isTags = location.pathname.startsWith("/admin/fags");
    const isUsers = location.pathname.startsWith("/admin/users");

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

                        <Link
                            to="/admin/comments"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isComments
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Comments
                        </Link>

                        <Link
                            to="/admin/categories"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isCategories
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <Layers className="h-4 w-4" />
                            Categories
                        </Link>

                        <Link
                            to="/admin/comments"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isTags
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <Tags className="h-4 w-4" />
                            Tags
                        </Link>

                        <Link
                            to="/admin/comments"
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isUsers
                                ? "bg-accent-soft text-accent"
                                : "text-slate hover:bg-surface-alt hover:text-ink"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Users
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