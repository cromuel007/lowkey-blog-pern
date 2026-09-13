import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { api } from "../api";
import type { Post } from "../types";
import { getAsset } from "../utils/useAssets";

export default function PostPage() {
    const { slug } = useParams();

    const [post, setPost] = useState<Post | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [error, setError] = useState("");
    const [loadingDots, setLoadingDots] = useState(".");

    useEffect(() => {
        Promise.all([
            api.get<Post>(`/api/posts/${slug}`),
            api.get<Post[]>("/api/posts"),
        ])
            .then(([postResponse, postsResponse]) => {
                const currentPost = postResponse.data;

                setPost(currentPost);
                setPosts(postsResponse.data);

                document.title =
                    currentPost.seoTitle || currentPost.title;

                const meta = document.querySelector(
                    'meta[name="description"]'
                );

                if (meta) {
                    meta.setAttribute(
                        "content",
                        currentPost.seoDescription ||
                        currentPost.excerpt ||
                        ""
                    );
                }
            })
            .catch(() => setError("Post not found."));
    }, [slug]);


    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingDots((dots) =>
                dots.length === 3 ? "" : dots + "."
            );
        }, 400);

        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <p className="py-20 text-center font-medium text-danger">
                {error}
            </p>
        );
    }

    if (!post) {
        return (
            <div className="flex min-h-[300px] items-center justify-center pt-80 pb-100 text-center text-slate">
                Loading Post
                <span className="inline-block w-[18px] text-left">
                    {loadingDots}
                </span>
            </div>
        );
    }

    const currentIndex = posts.findIndex(
        (item) => item.id === post.id
    );

    const previousPost =
        currentIndex > 0 ? posts[currentIndex - 1] : null;

    const nextPost =
        currentIndex >= 0 && currentIndex < posts.length - 1
            ? posts[currentIndex + 1]
            : null;

    return (
        <article className="mx-auto my-4 mb-4 max-w-[1080px] leading-[1.8] sm:mt-14 sm:mb-16">
            <Link
                to="/"
                className="read-article-link inline-flex items-center gap-1 font-bold"
            >
                <ArrowLeft className="mt-0.5 h-4 w-4" />
                Back to blogs
            </Link>

            <p className="mt-4 text-[0.85rem] font-medium text-muted">
                {post.category?.name || "General"} ·{" "}
                {new Date(
                    post.publishedAt || post.createdAt
                ).toLocaleDateString()}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-6xl">
                {post.title}
            </h1>

            {post.excerpt && (
                <p className="mt-5 mb-8 text-xl text-slate">
                    {post.excerpt}
                </p>
            )}

            <img
                className="my-8 max-h-[300px] w-full rounded-2xl object-cover"
                src={post.coverImageUrl || getAsset("sky.png")}
                alt=""
            />

            <div className="prose max-w-none text-slate">
                <div
                    className="
                    prose
                    prose-slate
                    max-w-none
                    text-slate

                    [&_a]:font-medium
                    [&_a]:!text-blue-600
                    [&_a]:underline
                    [&_a]:underline-offset-2
                    [&_a:hover]:text-blue-800

                    [&_p]:my-5
                    [&_p]:leading-[1.8]

                    [&_h1]:mb-5
                    [&_h1]:mt-10
                    [&_h1]:font-extrabold
                    [&_h1]:text-ink

                    [&_h2]:mb-4
                    [&_h2]:mt-10
                    [&_h2]:text-2xl
                    [&_h2]:font-extrabold
                    [&_h2]:text-ink

                    [&_h3]:mb-3
                    [&_h3]:mt-8
                    [&_h3]:text-xl
                    [&_h3]:font-bold
                    [&_h3]:text-ink

                    [&_ul]:my-5
                    [&_ul]:list-disc
                    [&_ul]:pl-6

                    [&_ol]:my-5
                    [&_ol]:list-decimal
                    [&_ol]:pl-6

                    [&_li]:my-2

                    [&_strong]:font-bold
                    [&_em]:italic

                    [&_blockquote]:my-6
                    [&_blockquote]:border-l-4
                    [&_blockquote]:border-line
                    [&_blockquote]:pl-5
                    [&_blockquote]:italic

                    [&_pre]:my-6
                    [&_pre]:overflow-x-auto
                    [&_pre]:rounded-lg
                    [&_pre]:border
                    [&_pre]:border-line
                    [&_pre]:bg-surface-alt
                    [&_pre]:p-4
                    [&_pre]:font-mono
                    [&_pre]:text-sm
                    [&_pre]:leading-relaxed
                    [&_pre]:text-ink
                    [&_pre_code]:bg-transparent
                    [&_pre_code]:p-0
                    [&_pre_code]:text-inherit
                "
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(post.content, {
                                ADD_ATTR: ["target", "rel"],
                            }).replace(
                                /<a\s/gi,
                                '<a target="_blank" rel="noopener noreferrer" '
                            ),
                        }}
                    />
                </div>
            </div>

            {/* Previous / Next */}
            <div className="mt-14 grid grid-cols-1 gap-4 border-t border-line pt-0 sm:grid-cols-2 sm:pt-8 sm:-mb-5">
                {previousPost ? (
                    <Link
                        to={`/posts/${previousPost.slug}`}
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        className="group rounded-xl p-5 transition-colors hover:border-[#d4a017]"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold text-muted transition-colors group-hover:text-[#d4a017]">
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </div>

                        <div className="mt-2 text-lg font-bold leading-tight text-ink transition-colors group-hover:text-[#d4a017]">
                            {previousPost.title}
                        </div>
                    </Link>
                ) : (
                    <div />
                )}

                {nextPost ? (
                    <Link
                        to={`/posts/${nextPost.slug}`}
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        className="group rounded-xl p-5 text-left transition-colors hover:border-[#d4a017] sm:text-right"
                    >
                        <div className="flex items-center justify-end gap-2 text-sm font-bold text-muted transition-colors group-hover:text-[#d4a017]">
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </div>

                        <div className="mt-2 text-lg font-bold leading-tight text-ink transition-colors group-hover:text-[#d4a017]">
                            {nextPost.title}
                        </div>
                    </Link>
                ) : (
                    <div />
                )}
            </div>
        </article>
    );
}