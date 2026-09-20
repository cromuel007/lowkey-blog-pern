import { useEffect, useState } from "react";
import {
    Heart,
    ThumbsUp,
} from "lucide-react";
import * as Flags from "country-flag-icons/react/3x2";
import { api } from "../api";
import { motion } from "motion/react";
import { useLoadingDots } from "../hooks/useLoadingDots";

const REFRESH_INTERVAL = 10000;

type Comment = {
    id: number;
    author: string;
    content: string;
    countryCode: string | null;
    likes: number;
    liked: boolean;
    replies: Comment[];
};

function createPendingComment(
    author: string,
    content: string,
    id: number
): Comment {
    return {
        id,
        author,
        content,
        countryCode: null,
        likes: 0,
        liked: false,
        replies: [],
    };
}

type CommentsResponse = {
    comments: Comment[];
    commentCount: number;
};

type CommentsProps = {
    postId: number;
    slug: string;
    initialCount?: number;
};

const PLANETS = [
    { emoji: "🌏", name: "Earth" },
    { emoji: "🦄", name: "Unicorn World" },
    { emoji: "🏳️‍🌈", name: "LGBTQ Community" },
    { emoji: "🪐", name: "Saturn" },
    { emoji: "🌔", name: "Moon" },
    { emoji: "💔", name: "a broken-hearted relationship" },
];

const ANIMAL_NAMES = [
    "Panda",
    "Monkey",
    "Koala",
    "Penguin",
    "Fox",
    "Otter",
    "Tiger",
    "Bunny",
    "Sloth",
    "Hamster",
    "Raccoon",
];

const planetCache = new Map<
    number,
    (typeof PLANETS)[number]
>();

function getPlanet(entryId: number) {
    if (planetCache.has(entryId)) {
        return planetCache.get(entryId)!;
    }

    const planet =
        PLANETS[
        Math.floor(
            Math.random() * PLANETS.length
        )
        ];

    planetCache.set(entryId, planet);

    return planet;
}

function getCountryName(
    countryCode: string | null
) {
    if (!countryCode) return null;

    return (
        new Intl.DisplayNames(["en"], {
            type: "region",
        }).of(countryCode) || null
    );
}

function CountryFlag({
    countryCode,
    entryId,
}: {
    countryCode: string | null;
    entryId: number;
}) {
    if (!countryCode) {
        return (
            <span
                className="inline-flex h-[14px] w-[20px] items-center justify-center text-sm leading-none"
                title={`From ${getPlanet(entryId).name}`}
            >
                {getPlanet(entryId).emoji}
            </span>
        );
    }

    const code =
        countryCode.toUpperCase() as keyof typeof Flags;

    const Flag = Flags[code];

    if (!Flag) {
        return (
            <span
                className="inline-flex h-[14px] w-[20px] items-center justify-center text-sm leading-none"
                title={`From ${getPlanet(entryId).name}`}
            >
                {getPlanet(entryId).emoji}
            </span>
        );
    }

    return (
        <span
            className="inline-flex h-[14px] w-[20px] shrink-0 items-center justify-center"
            title={`From ${getCountryName(countryCode) ||
                countryCode
                }`}
        >
            <Flag
                width={21}
                height={14}
                className="block h-[14px] w-[21px]"
            />
        </span>
    );
}

function getAnimalName(entryId: number) {
    const key = `guestbook-animal-${entryId}`;

    const stored =
        localStorage.getItem(key);

    if (stored) return stored;

    const animal =
        ANIMAL_NAMES[
        Math.floor(
            Math.random() *
            ANIMAL_NAMES.length
        )
        ];

    localStorage.setItem(key, animal);

    return animal;
}

function isAllowedGiphyUrl(
    value: string
): boolean {
    try {
        const url = new URL(value);

        if (url.protocol !== "https:") {
            return false;
        }

        const hostname =
            url.hostname.toLowerCase();

        return (
            hostname === "giphy.com" ||
            hostname.endsWith(".giphy.com")
        );
    } catch {
        return false;
    }
}

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s]+/gi;

const EMAIL_REGEX =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function hasDisallowedUrlOrEmail(
    content: string
): boolean {
    /*
     * Check email addresses first.
     */
    EMAIL_REGEX.lastIndex = 0;

    if (EMAIL_REGEX.test(content)) {
        return true;
    }

    /*
     * Check URLs.
     */
    URL_REGEX.lastIndex = 0;

    const urls =
        content.match(URL_REGEX) || [];

    return urls.some((rawUrl) => {
        /*
         * Remove punctuation that may have
         * been placed immediately after a URL.
         */
        const cleanUrl =
            rawUrl.replace(/[),.!?]+$/, "");

        return !isAllowedGiphyUrl(
            cleanUrl
        );
    });
}

function renderCommentContent(
    content: string
) {
    const urlRegex =
        /(https?:\/\/[^\s]+)/gi;

    const parts =
        content.split(urlRegex);

    return parts.map((part, index) => {
        const isUrl =
            /^https?:\/\/[^\s]+$/i.test(
                part
            );

        if (!isUrl) {
            return (
                <span key={index}>
                    {part}
                </span>
            );
        }

        const trailingMatch =
            part.match(/[),.!?]+$/);

        const trailing =
            trailingMatch?.[0] || "";

        const cleanUrl = trailing
            ? part.slice(
                0,
                -trailing.length
            )
            : part;

        if (
            !isAllowedGiphyUrl(cleanUrl)
        ) {
            return (
                <span key={index}>
                    {part}
                </span>
            );
        }

        let isGiphyMedia = false;

        try {
            const url =
                new URL(cleanUrl);

            const hostname =
                url.hostname.toLowerCase();

            const pathname =
                url.pathname.toLowerCase();

            isGiphyMedia =
                hostname.startsWith(
                    "media"
                ) ||
                /\.(gif|webp|png|jpe?g|avif)(?:\?.*)?$/i.test(
                    pathname
                );
        } catch {
            isGiphyMedia = false;
        }

        /*
         * Giphy media URLs are rendered
         * as actual images/GIFs.
         */
        if (isGiphyMedia) {
            return (
                <span
                    key={index}
                    className="block"
                >
                    <a
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        referrerPolicy="no-referrer"
                        className="inline-block max-w-full"
                    >
                        <img
                            src={cleanUrl}
                            alt="Giphy GIF"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="mt-2 max-h-[320px] max-w-full rounded-lg object-contain"
                        />
                    </a>

                    {trailing && (
                        <span>
                            {trailing}
                        </span>
                    )}
                </span>
            );
        }

        /*
         * A normal Giphy page URL is allowed,
         * but it is not treated as an image.
         */
        return (
            <span key={index}>
                <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    referrerPolicy="no-referrer"
                    className="text-[#d4a017] underline"
                >
                    {cleanUrl}
                </a>

                {trailing}
            </span>
        );
    });
}

export default function Comments({
    postId,
    slug,
    initialCount = 0,
}: CommentsProps) {
    const [comments, setComments] =
        useState<Comment[]>([]);

    const [commentText, setCommentText] =
        useState("");

    const [commentAuthor, setCommentAuthor] =
        useState("");

    const [replyingTo, setReplyingTo] =
        useState<number | null>(null);

    const [replyText, setReplyText] =
        useState("");

    const [replyAuthor, setReplyAuthor] =
        useState("");

    const [showReplies, setShowReplies] =
        useState<number[]>([]);

    const [showLikeBurst, setShowLikeBurst] =
        useState<number | null>(null);

    const [commentCount, setCommentCount] =
        useState(initialCount);

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        isSubmittingComment,
        setIsSubmittingComment,
    ] = useState(false);

    const [
        isSubmittingReply,
        setIsSubmittingReply,
    ] = useState<number | null>(null);

    const [error, setError] =
        useState("");

    const [replyStatus, setReplyStatus] =
        useState<{
            commentId: number;
            type: "success" | "error";
            message: string;
        } | null>(null);

    const [showCommentForm, setShowCommentForm] = useState(false);
    const loadingDots = useLoadingDots();

    /*
     * Load comments initially and refresh
     * every 10 seconds.
     */
    useEffect(() => {
        let cancelled = false;

        const fetchComments = async () => {
            try {
                const response =
                    await api.get<CommentsResponse>(
                        `/api/posts/${slug}/comments`
                    );

                if (cancelled) return;

                const fetchedComments =
                    response.data.comments || [];

                setComments((previous) => {
                    /*
                     * Keep locally submitted comments and replies
                     * visible until their approved versions appear
                     * in the API response.
                     *
                     * Temporary entries use negative IDs.
                     */
                    const pendingComments =
                        previous.filter(
                            (comment) => comment.id < 0
                        );

                    const mergedComments =
                        fetchedComments.map((comment) => {
                            const previousComment =
                                previous.find(
                                    (item) =>
                                        item.id === comment.id
                                );

                            if (!previousComment) {
                                return comment;
                            }

                            const pendingReplies =
                                previousComment.replies.filter(
                                    (reply) => reply.id < 0
                                );

                            const stillPendingReplies =
                                pendingReplies.filter(
                                    (pendingReply) =>
                                        !comment.replies.some(
                                            (reply) =>
                                                reply.author ===
                                                pendingReply.author &&
                                                reply.content ===
                                                pendingReply.content
                                        )
                                );

                            return {
                                ...comment,
                                replies: [
                                    ...comment.replies,
                                    ...stillPendingReplies,
                                ],
                            };
                        });

                    /*
                     * Keep a pending top-level comment until the
                     * approved version is returned by the API.
                     */
                    const stillPendingComments =
                        pendingComments.filter(
                            (pendingComment) =>
                                !fetchedComments.some(
                                    (comment) =>
                                        comment.author ===
                                        pendingComment.author &&
                                        comment.content ===
                                        pendingComment.content
                                )
                        );

                    return [
                        ...mergedComments,
                        ...stillPendingComments,
                    ];
                });

                setCommentCount(
                    response.data.commentCount ?? 0
                );
            } catch (error) {
                if (cancelled) return;

                console.error(
                    "Failed to fetch comments:",
                    error
                );

                setError("Could not load comments.");
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);

        fetchComments();

        const interval = setInterval(
            fetchComments,
            REFRESH_INTERVAL
        );

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [slug]);

    const addComment = async () => {
        const content = commentText.trim();

        const author =
            commentAuthor.trim() ||
            `Anonymous ${getAnimalName(
                Math.floor(Math.random() * 10)
            )}`;

        if (!content || isSubmittingComment) {
            return;
        }

        /*
         * Validate before making the API request.
         */
        setError("");
        setReplyStatus(null);

        if (hasDisallowedUrlOrEmail(content)) {
            setError(
                "Email addresses and external links are not allowed. Only Giphy links are allowed."
            );
            return;
        }

        try {
            setIsSubmittingComment(true);

            await api.post(
                `/api/posts/${postId}/comments`,
                {
                    author,
                    content,
                }
            );

            /*
             * Show the comment immediately as a normal comment.
             * The negative ID marks it as temporary so the next
             * refresh can replace it with the real database record.
             */
            const pendingComment =
                createPendingComment(
                    author,
                    content,
                    -Date.now()
                );

            setComments((previous) => [
                pendingComment,
                ...previous,
            ]);

            setCommentAuthor("");
            setCommentText("");
            setShowCommentForm(false);
        } catch (error) {
            console.error(
                "Failed to submit comment:",
                error
            );

            setError(
                "Could not submit your comment. Please try again."
            );
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const addReply = async (
        commentId: number
    ) => {
        const content = replyText.trim();

        const author =
            replyAuthor.trim() ||
            `Anonymous ${getAnimalName(
                Math.floor(Math.random() * 10)
            )}`;

        if (
            !content ||
            isSubmittingReply !== null
        ) {
            return;
        }

        /*
         * Validate before making the API request.
         */
        setError("");
        setReplyStatus(null);

        if (hasDisallowedUrlOrEmail(content)) {
            setReplyStatus({
                commentId,
                type: "error",
                message:
                    "Email addresses and external links are not allowed. Only Giphy links are allowed.",
            });

            return;
        }

        try {
            setIsSubmittingReply(commentId);

            await api.post(
                `/api/posts/${postId}/comments/${commentId}/replies`,
                {
                    author,
                    content,
                }
            );

            /*
             * Show the reply immediately as a normal reply.
             * The negative ID marks it as temporary so the next
             * refresh can replace it with the real database record.
             */
            const pendingReply =
                createPendingComment(
                    author,
                    content,
                    -Date.now()
                );

            setComments((previous) =>
                previous.map((comment) =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            replies: [
                                ...comment.replies,
                                pendingReply,
                            ],
                        }
                        : comment
                )
            );

            /*
             * Make sure the replies are visible immediately.
             */
            setShowReplies((previous) =>
                previous.includes(commentId)
                    ? previous
                    : [...previous, commentId]
            );

            setReplyAuthor("");
            setReplyText("");
            setReplyingTo(null);
            setReplyStatus(null);
        } catch (error) {
            console.error(
                "Failed to submit reply:",
                error
            );

            setReplyStatus({
                commentId,
                type: "error",
                message:
                    "Could not submit your reply. Please try again.",
            });
        } finally {
            setIsSubmittingReply(null);
        }
    };

    const toggleCommentLike = async (
        commentId: number,
        replyId?: number
    ) => {
        const targetComment =
            comments.find(
                (comment) =>
                    comment.id === commentId
            );

        if (!targetComment) return;

        /*
         * Reply like
         */
        if (replyId !== undefined) {
            const targetReply =
                targetComment.replies.find(
                    (reply) =>
                        reply.id === replyId
                );

            if (!targetReply) return;

            const previousLiked =
                targetReply.liked;

            const previousLikes =
                targetReply.likes;

            setComments((previous) =>
                previous.map((comment) =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            replies:
                                comment.replies.map(
                                    (reply) =>
                                        reply.id ===
                                            replyId
                                            ? {
                                                ...reply,
                                                liked:
                                                    !reply.liked,
                                                likes:
                                                    reply.liked
                                                        ? Math.max(
                                                            0,
                                                            reply.likes -
                                                            1
                                                        )
                                                        : reply.likes +
                                                        1,
                                            }
                                            : reply
                                ),
                        }
                        : comment
                )
            );

            try {
                const response =
                    await api.post(
                        `/api/posts/${postId}/comments/${replyId}/like`
                    );

                setComments((previous) =>
                    previous.map((comment) =>
                        comment.id ===
                            commentId
                            ? {
                                ...comment,
                                replies:
                                    comment.replies.map(
                                        (reply) =>
                                            reply.id ===
                                                replyId
                                                ? {
                                                    ...reply,
                                                    liked:
                                                        response
                                                            .data
                                                            .liked,
                                                    likes:
                                                        response
                                                            .data
                                                            .likeCount,
                                                }
                                                : reply
                                    ),
                            }
                            : comment
                    )
                );
            } catch (error) {
                console.error(
                    "Failed to update reply like:",
                    error
                );

                setComments((previous) =>
                    previous.map((comment) =>
                        comment.id ===
                            commentId
                            ? {
                                ...comment,
                                replies:
                                    comment.replies.map(
                                        (reply) =>
                                            reply.id ===
                                                replyId
                                                ? {
                                                    ...reply,
                                                    liked:
                                                        previousLiked,
                                                    likes:
                                                        previousLikes,
                                                }
                                                : reply
                                    ),
                            }
                            : comment
                    )
                );
            }

            return;
        }

        /*
         * Comment like
         */
        const previousLiked =
            targetComment.liked;

        const previousLikes =
            targetComment.likes;

        setComments((previous) =>
            previous.map((comment) =>
                comment.id === commentId
                    ? {
                        ...comment,
                        liked:
                            !comment.liked,
                        likes:
                            comment.liked
                                ? Math.max(
                                    0,
                                    comment.likes -
                                    1
                                )
                                : comment.likes +
                                1,
                    }
                    : comment
            )
        );

        try {
            const response =
                await api.post(
                    `/api/posts/${postId}/comments/${commentId}/like`
                );

            setComments((previous) =>
                previous.map((comment) =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            liked:
                                response.data
                                    .liked,
                            likes:
                                response.data
                                    .likeCount,
                        }
                        : comment
                )
            );
        } catch (error) {
            console.error(
                "Failed to update comment like:",
                error
            );

            setComments((previous) =>
                previous.map((comment) =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            liked:
                                previousLiked,
                            likes:
                                previousLikes,
                        }
                        : comment
                )
            );
        }
    };

    const toggleReplies = (
        commentId: number
    ) => {
        setShowReplies((previous) =>
            previous.includes(commentId)
                ? previous.filter(
                    (id) =>
                        id !== commentId
                )
                : [
                    ...previous,
                    commentId,
                ]
        );
    };

    /*
     * Auto-dismiss error/status messages after 5 seconds.
     */
    useEffect(() => {
        if (!error && !replyStatus) {
            return;
        }

        const timeout = setTimeout(() => {
            setError("");
            setReplyStatus(null);
        }, 5000);

        return () => clearTimeout(timeout);
    }, [error, replyStatus]);

    return (
        <div className="mt-8 border-t border-line pt-6">
            <div className="mx-auto max-w-[760px]">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-ink">
                        Comments
                        {(commentCount +
                            comments.filter(
                                (comment) => comment.id < 0
                            ).length) > 0 && (
                                <span className="ml-2 text-sm font-medium text-muted">
                                    ({commentCount +
                                        comments.filter(
                                            (comment) => comment.id < 0
                                        ).length})
                                </span>
                            )}
                    </h2>

                    {!showCommentForm && (
                        <button
                            type="button"
                            onClick={() => setShowCommentForm((prev) => !prev)}
                            className="rounded-full border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-[#d4a017] hover:text-[#d4a017]"
                        >
                            Post a Comment
                        </button>
                    )}
                </div>

                {/* New comment */}
                {showCommentForm && (
                    <>
                        <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-alt text-sm font-bold text-white">
                                <CountryFlag
                                    countryCode={null}
                                    entryId={0}
                                />
                            </div>

                            <div className="flex-1">


                                <input
                                    type="text"
                                    value={commentAuthor}
                                    onChange={(event) =>
                                        setCommentAuthor(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Your name"
                                    disabled={isSubmittingComment}
                                    className="mb-2 w-full rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                                />

                                <textarea
                                    value={commentText}
                                    onChange={(event) =>
                                        setCommentText(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Add a comment..."
                                    rows={3}
                                    disabled={isSubmittingComment}
                                    className="w-full resize-y rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                                />

                                <div className="mt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCommentForm((prev) => !prev)}
                                        className="rounded-full px-4 py-2 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={addComment}
                                        disabled={
                                            !commentText.trim() ||
                                            isSubmittingComment
                                        }
                                        className="rounded-full bg-[#d4a017] px-4 py-2 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {isSubmittingComment ? (
                                            <span className="inline-flex min-w-[82px] items-center justify-start">
                                                <span>Submitting</span>

                                                <span className="w-[18px] text-left">
                                                    {loadingDots}
                                                </span>
                                            </span>
                                        ) : (
                                            "Comment"
                                        )}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="ml-[48px] mt-4 w-[calc(100%-48px)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Comments */}
                <div className="mt-6 space-y-6">
                    {isLoading ? (
                        <p className="py-6 text-center text-sm text-muted">
                            Loading comments...
                        </p>
                    ) : (
                        <>
                            {comments.map(
                                (comment) => (
                                    <div
                                        key={
                                            comment.id
                                        }
                                    >
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-alt text-sm font-bold text-ink">
                                                <CountryFlag
                                                    countryCode={
                                                        comment.countryCode
                                                    }
                                                    entryId={
                                                        comment.id
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                {/* Comment */}
                                                <div className="rounded-xl bg-surface-alt px-4 py-3">
                                                    <div className="text-sm font-bold text-ink">
                                                        {
                                                            comment.author
                                                        }
                                                    </div>

                                                    <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                                                        {renderCommentContent(
                                                            comment.content
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-2 flex items-center gap-4 px-2 text-xs font-semibold text-muted">
                                                    {/* Like */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                !comment.liked
                                                            ) {
                                                                setShowLikeBurst(
                                                                    comment.id
                                                                );
                                                            }

                                                            toggleCommentLike(
                                                                comment.id
                                                            );
                                                        }}
                                                        className={`transition-colors hover:text-[#d4a017] ${comment.liked
                                                            ? "text-[#d4a017]"
                                                            : ""
                                                            }`}
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                                                {showLikeBurst ===
                                                                    comment.id && (
                                                                        <span
                                                                            className="pointer-events-none absolute inset-0 z-20"
                                                                            onAnimationEnd={() =>
                                                                                setShowLikeBurst(
                                                                                    null
                                                                                )
                                                                            }
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

                                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                            </span>

                                                            Like

                                                            {comment.likes >
                                                                0 &&
                                                                ` · ${comment.likes}`}
                                                        </span>
                                                    </button>

                                                    {/* Reply */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyingTo(
                                                                comment.id
                                                            );
                                                            setReplyText(
                                                                ""
                                                            );
                                                            setReplyAuthor(
                                                                ""
                                                            );
                                                            setError(
                                                                ""
                                                            );
                                                            setReplyStatus(
                                                                null
                                                            );
                                                        }}
                                                        className="transition-colors hover:text-[#d4a017]"
                                                    >
                                                        Reply
                                                    </button>

                                                    {/* Replies */}
                                                    {comment
                                                        .replies
                                                        .length >
                                                        0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleReplies(
                                                                        comment.id
                                                                    )
                                                                }
                                                                className="transition-colors hover:text-[#d4a017]"
                                                            >
                                                                {showReplies.includes(
                                                                    comment.id
                                                                )
                                                                    ? "Hide replies"
                                                                    : `View ${comment.replies.length} ${comment
                                                                        .replies
                                                                        .length ===
                                                                        1
                                                                        ? "reply"
                                                                        : "replies"
                                                                    }`}
                                                            </button>
                                                        )}
                                                </div>

                                                {/* Reply input */}
                                                {replyingTo ===
                                                    comment.id && (
                                                        <div className="mt-4 flex gap-3 pl-2">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-alt text-xs font-bold text-white">
                                                                <CountryFlag
                                                                    countryCode={
                                                                        null
                                                                    }
                                                                    entryId={
                                                                        comment.id
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        replyAuthor
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        setReplyAuthor(
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Your name"
                                                                    disabled={
                                                                        isSubmittingReply !==
                                                                        null
                                                                    }
                                                                    className="mb-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                                                                />

                                                                <textarea
                                                                    value={replyText}
                                                                    onChange={(event) =>
                                                                        setReplyText(event.target.value)
                                                                    }
                                                                    placeholder="Write a reply..."
                                                                    rows={2}
                                                                    disabled={isSubmittingReply !== null}
                                                                    className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                                                                />

                                                                <div className="mt-2 flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReplyingTo(
                                                                                null
                                                                            );
                                                                            setReplyText(
                                                                                ""
                                                                            );
                                                                            setReplyAuthor(
                                                                                ""
                                                                            );
                                                                            setReplyStatus(
                                                                                null
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            isSubmittingReply !==
                                                                            null
                                                                        }
                                                                        className="rounded-full px-3 py-1.5 text-xs font-bold text-muted hover:text-ink disabled:opacity-50"
                                                                    >
                                                                        Cancel
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            addReply(comment.id)
                                                                        }
                                                                        disabled={
                                                                            !replyText.trim() ||
                                                                            isSubmittingReply !== null
                                                                        }
                                                                        className="rounded-full bg-[#d4a017] px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        {isSubmittingReply === comment.id ? (
                                                                            <span className="inline-flex min-w-[58px] items-center justify-start">
                                                                                <span>Submitting</span>

                                                                                <span className="w-[18px] text-left">
                                                                                    {loadingDots}
                                                                                </span>
                                                                            </span>
                                                                        ) : (
                                                                            "Reply"
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Reply status */}
                                                {replyStatus?.commentId ===
                                                    comment.id && (
                                                        <div
                                                            className={`mt-4 ml-[52px] w-[calc(100%-52px)] rounded-xl px-4 py-3 text-center text-sm ${replyStatus.type ===
                                                                "success"
                                                                ? "border border-[#d4a017]/30 bg-[#d4a017]/10 text-slate"
                                                                : "border border-red-200 bg-red-50 text-red-600"
                                                                }`}
                                                        >
                                                            {
                                                                replyStatus.message
                                                            }
                                                        </div>
                                                    )}

                                                {/* Replies */}
                                                {showReplies.includes(
                                                    comment.id
                                                ) &&
                                                    comment
                                                        .replies
                                                        .length >
                                                    0 && (
                                                        <div className="mt-4 ml-5 space-y-4 border-l-2 border-line pl-4">
                                                            {comment.replies.map(
                                                                (
                                                                    reply
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            reply.id
                                                                        }
                                                                        className="flex gap-3"
                                                                    >
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-alt text-xs font-bold text-ink">
                                                                            <CountryFlag
                                                                                countryCode={
                                                                                    reply.countryCode
                                                                                }
                                                                                entryId={
                                                                                    reply.id
                                                                                }
                                                                            />
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="rounded-xl bg-surface-alt px-4 py-3">
                                                                                <div className="text-sm font-bold text-ink">
                                                                                    {
                                                                                        reply.author
                                                                                    }
                                                                                </div>

                                                                                <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                                                                                    {renderCommentContent(
                                                                                        reply.content
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Like */}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (
                                                                                        !reply.liked
                                                                                    ) {
                                                                                        setShowLikeBurst(
                                                                                            reply.id
                                                                                        );
                                                                                    }

                                                                                    toggleCommentLike(
                                                                                        comment.id,
                                                                                        reply.id
                                                                                    );
                                                                                }}
                                                                                className={`text-xs font-semibold transition-colors hover:text-[#d4a017] ${reply.liked
                                                                                    ? "text-[#d4a017]"
                                                                                    : "text-muted"
                                                                                    }`}
                                                                            >
                                                                                <span className="inline-flex items-center gap-1">
                                                                                    <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                                                                        {showLikeBurst ===
                                                                                            reply.id && (
                                                                                                <span
                                                                                                    className="pointer-events-none absolute inset-0 z-20"
                                                                                                    onAnimationEnd={() =>
                                                                                                        setShowLikeBurst(
                                                                                                            null
                                                                                                        )
                                                                                                    }
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

                                                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                                                    </span>

                                                                                    Like

                                                                                    {reply.likes >
                                                                                        0 &&
                                                                                        ` · ${reply.likes}`}
                                                                                </span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {comments.length ===
                                0 && (
                                    <p className="py-6 text-center text-sm text-muted">
                                        No comments yet. Be the first to share your thoughts!{" "}
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
                                            👋
                                        </motion.span>
                                    </p>
                                )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}