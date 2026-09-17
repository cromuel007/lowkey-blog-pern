import { useState } from "react";
import {
    ArrowLeft,
} from "lucide-react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import { api } from "../api";
import { getAsset } from "../utils/useAssets";
import { useLoadingDots } from "../hooks/useLoadingDots";

export default function AdminLogin() {
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