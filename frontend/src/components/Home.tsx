import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Post } from "../types";
import { getAsset } from "../utils/useAssets";
import { useLoadingDots } from "../hooks/useLoadingDots";

const REFRESH_INTERVAL = 60000;

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const loadingDots = useLoadingDots();

    const fetchPosts = async (showLoading = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await api.get<Post[]>("/api/posts");

            setPosts(response.data);
            setError("");
        } catch {
            setError("Could not load posts.");
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    /*
     * Initial fetch
     */
    useEffect(() => {
        fetchPosts(true);
    }, []);

    /*
     * Auto refresh
     */
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPosts();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    return (
        <section>
            <div className="max-w-[1000px] py-6 sm:py-16">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent">
                    MY BLOG
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-6xl">
                    A lowkey place for highkey questionable ideas.
                </h1>

                <p className="mt-5 text-xl text-slate">
                    A developer-focused blog where bugs become features and
                    features become bugs. 😄
                </p>
            </div>

            {error && (
                <div className="flex min-h-[300px] items-center justify-center pt-29.5 pb-59.5 text-center text-slate">
                    {error}
                </div>
            )}

            {loading && (
                <div className="flex min-h-[300px] items-center justify-center pt-29.5 pb-59.5 text-center text-slate">
                    Loading Posts
                    <span className="inline-block w-[18px] text-left">
                        {loadingDots}
                    </span>
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 gap-6 pb-10 sm:-mt-4 sm:pb-15 md:grid-cols-2">
                    {posts.map((post) => (
                        <article
                            className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            key={post.id}
                        >
                            <img
                                src={
                                    post.coverImageUrl ||
                                    getAsset("sky.png")
                                }
                                alt={post.title}
                                className="aspect-[16/9] w-full object-cover"
                            />

                            <div className="flex flex-1 flex-col p-6">
                                <p className="text-[0.85rem] font-medium text-muted">
                                    {post.category?.name || "General"} ·{" "}
                                    {new Date(
                                        post.publishedAt || post.createdAt
                                    ).toLocaleDateString()}
                                </p>

                                <h2 className="mt-3 text-2xl font-bold leading-tight text-ink">
                                    <Link
                                        to={`/posts/${post.slug}`}
                                        className="read-article-link mt-auto inline-flex items-center gap-1 pt-5 font-bold"
                                    >
                                        {post.title}
                                    </Link>
                                </h2>

                                <p className="mt-3 leading-[1.7] text-slate">
                                    {post.excerpt ||
                                        post.content
                                            .replace(/<[^>]*>/g, "")
                                            .slice(0, 180)}
                                    {post.content.replace(/<[^>]*>/g, "")
                                        .length > 180
                                        ? "..."
                                        : ""}
                                </p>

                                <Link
                                    to={`/posts/${post.slug}`}
                                    className="read-article-link mt-auto inline-flex items-center gap-1 pt-5 font-bold"
                                >
                                    Read article
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!loading && !posts.length && !error && (
                <div className="flex min-h-[300px] items-center justify-center pb-50 text-center text-slate">
                    Nothing here yet... even the bugs took a day off. 🐛😴
                </div>
            )}
        </section>
    );
}