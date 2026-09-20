import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    MessageCircle,
    Share2,
    ThumbsUp,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
    FacebookIcon,
    FacebookShareButton,
    LinkedinIcon,
    LinkedinShareButton,
    TelegramIcon,
    TelegramShareButton,
    TwitterIcon,
    TwitterShareButton,
    WhatsappIcon,
    WhatsappShareButton,
} from "react-share";
import { api } from "../api";
import type { Post } from "../types";
import { getAsset } from "../utils/useAssets";
import { motion } from "motion/react";
import { useLoadingDots } from "../hooks/useLoadingDots";
import Comments from "../components/Comments";

const REFRESH_INTERVAL = 10000;

export default function PostPage() {
    const { slug } = useParams();

    const [post, setPost] = useState<Post | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [error, setError] = useState("");
    const loadingDots = useLoadingDots();

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiking, setIsLiking] = useState(false);
    const [showLikeBurst, setShowLikeBurst] = useState(false);

    const [showShareButtons, setShowShareButtons] = useState(false);

    const [showComments, setShowComments] = useState(true);
    const commentsRef = useRef<HTMLDivElement>(null);

    const fetchPost = async () => {
        if (!slug) {
            return;
        }

        try {
            const [postResponse, postsResponse] = await Promise.all([
                api.get<Post>(`/api/posts/${slug}`),
                api.get<Post[]>("/api/posts"),
            ]);

            const currentPost = postResponse.data;

            setPost(currentPost);
            setPosts(postsResponse.data);

            // Sync like state from the API
            setLiked(currentPost.liked ?? false);
            setLikeCount(currentPost.likeCount ?? 0);

            const title =
                currentPost.seoTitle || currentPost.title;

            const description =
                currentPost.seoDescription ||
                currentPost.excerpt ||
                "";

            const url =
                `https://blog.tubbylab.com/posts/${currentPost.slug}`;

            const image =
                currentPost.coverImageUrl ||
                "https://blog.tubbylab.com/og-image.png";

            document.title = title;

            const setMeta = (
                attribute: "name" | "property",
                key: string,
                content: string
            ) => {
                let meta = document.querySelector(
                    `meta[${attribute}="${key}"]`
                );

                if (!meta) {
                    meta = document.createElement("meta");
                    meta.setAttribute(attribute, key);
                    document.head.appendChild(meta);
                }

                meta.setAttribute("content", content);
            };

            setMeta("name", "description", description);

            setMeta("property", "og:title", title);
            setMeta("property", "og:description", description);
            setMeta("property", "og:url", url);
            setMeta("property", "og:type", "article");
            setMeta("property", "og:image", image);

            setMeta(
                "name",
                "twitter:card",
                "summary_large_image"
            );
            setMeta("name", "twitter:title", title);
            setMeta(
                "name",
                "twitter:description",
                description
            );
            setMeta("name", "twitter:image", image);

            setError("");
        } catch (error) {
            console.error("Failed to fetch post:", error);
            setError("Post not found.");
        }
    };

    // Initial fetch + automatic refresh every 10 seconds
    useEffect(() => {
        fetchPost();

        const interval = setInterval(() => {
            fetchPost();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [slug]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                commentsRef.current &&
                !commentsRef.current.contains(event.target as Node)
            ) {
                setShowComments(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    if (error) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center pt-80 pb-100 text-center text-slate">
                <p>
                    {error}{" "}
                    <motion.span
                        animate={{
                            rotate: [0, 20, -20, 15, -15, 0],
                            x: [0, 3, -3, 3, -3, 0],
                            scale: [1, 1.15, 0.9, 1.1, 0.95, 1],
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeInOut",
                        }}
                        className="inline-block"
                    >
                        😵
                    </motion.span>
                </p>

                <Link
                    to="/"
                    className="pt-4 -mb-4 read-article-link inline-flex items-center gap-1 font-bold"
                >
                    <ArrowLeft className="mt-0.5 h-4 w-4" />
                    Pretend this never happened
                </Link>
            </div>
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
        currentIndex >= 0 &&
            currentIndex < posts.length - 1
            ? posts[currentIndex + 1]
            : null;

    const shareUrl =
        `https://blog.tubbylab.com/posts/${post.slug}`;

    const trackShare = async (
        platform: "facebook" | "linkedin" | "twitter"
    ) => {
        try {
            await api.post(`/api/posts/${post.id}/share`, {
                platform,
            });

            setPost((current) =>
                current
                    ? {
                        ...current,
                        shared: true,
                        shareCount: (current.shareCount ?? 0) + 1,
                    }
                    : current
            );
        } catch (error) {
            console.error("Failed to track share:", error);
        }
    };

    const handleLike = async () => {
        if (!post?.id || isLiking) return;

        const previousLiked = liked;
        const previousLikeCount = likeCount;

        const nextLiked = !liked;
        const nextLikeCount = liked
            ? Math.max(0, likeCount - 1)
            : likeCount + 1;

        // Only show the emoji burst when liking
        if (nextLiked) {
            setShowLikeBurst(true);
        }

        // Update UI immediately
        setLiked(nextLiked);
        setLikeCount(nextLikeCount);

        try {
            setIsLiking(true);

            await api.post(`/api/posts/${post.id}/like`);
        } catch (error) {
            console.error("Failed to update like:", error);

            setLiked(previousLiked);
            setLikeCount(previousLikeCount);
        } finally {
            setIsLiking(false);
        }
    };

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

            <div className="group my-8 max-h-[300px] overflow-hidden rounded-2xl">
                <img
                    className="w-full max-h-[300px] rounded-2xl object-cover object-center group-hover:animate-[imagePan_4s_ease-in-out_forwards]"
                    src={post.coverImageUrl || getAsset("sky.png")}
                    alt={post.slug || "sky"}
                />
            </div>

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

            {/* interactions */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 px-5 pt-5 -mb-5">

                {/* Like */}
                <button
                    type="button"
                    title={liked ? "Unlike" : "Like"}
                    onClick={handleLike}
                    disabled={isLiking}
                    className="read-article-link inline-flex items-center gap-2"
                >
                    <span className="relative inline-flex h-8 w-8 items-center justify-center">
                        {showLikeBurst && (
                            <span
                                className="pointer-events-none absolute inset-0 z-20"
                                onAnimationEnd={() => setShowLikeBurst(false)}
                            >
                                <Heart className="like-reaction like-reaction-1" />
                                <Heart className="like-reaction like-reaction-2" />
                                <Heart className="like-reaction like-reaction-3" />
                                <Heart className="like-reaction like-reaction-4" />
                                <Heart className="like-reaction like-reaction-5" />
                                <Heart className="like-reaction like-reaction-6" />
                                <Heart className="like-reaction like-reaction-7" />
                                <Heart className="like-reaction like-reaction-8" />
                                <Heart className="like-reaction like-reaction-9" />
                                <Heart className="like-reaction like-reaction-10" />
                            </span>
                        )}

                        <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${liked
                                ? "border-[#d4a017] bg-[#d4a017]"
                                : "border-slate hover:border-[#d4a017]"
                                }`}
                        >
                            <ThumbsUp
                                className={`h-4 w-4 stroke-[2] transition-colors ${liked ? "text-white" : ""
                                    }`}
                            />
                        </span>
                    </span>

                    <span title="Likes" className="text-xs">
                        {likeCount}
                    </span>
                </button>

                {/* Comments */}
                <div className="relative inline-flex items-center gap-2">
                    <button
                        type="button"
                        title="Comments"
                        // onClick={() =>
                        //     setShowComments((previous) => !previous)
                        // }
                        className="read-article-link inline-flex items-center"
                    >
                        <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${(post.commentCount ?? 0) > 0
                                ? "border-[#d4a017] bg-[#d4a017]"
                                : "border-slate hover:border-[#d4a017]"
                                }`}
                        >
                            <MessageCircle
                                className={`h-4 w-4 stroke-[2] transition-colors ${(post.commentCount ?? 0) > 0 ? "text-white" : ""
                                    }`}
                            />
                        </span>
                    </button>

                    <span className="text-xs">
                        {post.commentCount ?? 0}
                    </span>
                </div>

                {/* Shares */}
                <button
                    type="button"
                    title="Shares"
                    onClick={() => setShowShareButtons((previous) => !previous)}
                    className="read-article-link inline-flex items-center gap-2"
                >
                    <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${post.shared
                            ? "border-[#d4a017] bg-[#d4a017]"
                            : "border-slate hover:border-[#d4a017]"
                            }`}
                    >
                        <Share2
                            className={`h-4 w-4 stroke-[2] transition-colors ${post.shared ? "text-white" : ""
                                }`}
                        />
                    </span>

                    <span title="Shares" className="text-xs">
                        {post.shareCount ?? 0}
                    </span>
                </button>

                {showShareButtons && (
                    <div
                        className="flex basis-full items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:basis-auto"
                    >
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-ink sm:mb-0">
                            <Share2 className="h-4 w-4" />
                            Share with
                        </div>

                        <FacebookShareButton
                            url={shareUrl}
                            title={post.title}
                            onClick={() => trackShare("facebook")}
                        >
                            <FacebookIcon size={32} round />
                        </FacebookShareButton>

                        <LinkedinShareButton
                            url={shareUrl}
                            title={post.title}
                            onClick={() => trackShare("linkedin")}
                        >
                            <LinkedinIcon size={32} round />
                        </LinkedinShareButton>

                        <TwitterShareButton
                            url={shareUrl}
                            title={post.title}
                            onClick={() => trackShare("twitter")}
                        >
                            <TwitterIcon size={32} round />
                        </TwitterShareButton>
                    </div>
                )}
            </div>

            {/* Comments section */}
            {showComments && (
                <Comments
                    postId={post.id}
                    slug={post.slug}
                />
            )}

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