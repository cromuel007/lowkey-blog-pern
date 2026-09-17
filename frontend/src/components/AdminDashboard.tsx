import {
    ArrowRight,
    ExternalLink,
    FileText,
} from "lucide-react";
import {
    Link,
} from "react-router-dom";

export default function AdminDashboard() {
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