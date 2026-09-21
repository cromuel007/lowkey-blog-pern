import { useEffect, useRef, useState } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { api } from "../api";
import { motion } from "motion/react";
import { useLoadingDots } from "../hooks/useLoadingDots";

const REFRESH_INTERVAL = 10000;

type ReactionType =
    | "LIKE"
    | "CELEBRATE"
    | "SUPPORT"
    | "LOVE"
    | "INSIGHTFUL"
    | "FUNNY";

type ReactionCounts = {
    LIKE: number;
    CELEBRATE: number;
    SUPPORT: number;
    LOVE: number;
    INSIGHTFUL: number;
    FUNNY: number;
};

type Comment = {
    id: number;
    author: string;
    content: string;
    countryCode: string | null;
    reactionCounts: ReactionCounts;
    userReaction: ReactionType | null;
    replies: Comment[];
};

const EMPTY_REACTION_COUNTS: ReactionCounts = {
    LIKE: 0,
    CELEBRATE: 0,
    SUPPORT: 0,
    LOVE: 0,
    INSIGHTFUL: 0,
    FUNNY: 0,
};

const REACTIONS = [
    {
        type: "LIKE" as const,
        emoji: "👍",
        label: "Like",
    },
    {
        type: "CELEBRATE" as const,
        emoji: "🎉",
        label: "Celebrate",
    },
    {
        type: "SUPPORT" as const,
        emoji: "💪",
        label: "Support",
    },
    {
        type: "LOVE" as const,
        emoji: "❤️",
        label: "Love",
    },
    {
        type: "INSIGHTFUL" as const,
        emoji: "💡",
        label: "Insightful",
    },
    {
        type: "FUNNY" as const,
        emoji: "😂",
        label: "Funny",
    },
];

function getReactionMeta(
    reaction: ReactionType | null
) {
    return (
        REACTIONS.find(
            (item) => item.type === reaction
        ) ?? REACTIONS[0]
    );
}

function getReactionSummary(comment: Comment) {
    return REACTIONS.filter(
        (reaction) =>
            comment.reactionCounts[reaction.type] > 0
    );
}

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
        reactionCounts: {
            ...EMPTY_REACTION_COUNTS,
        },
        userReaction: null,
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
    {
        emoji: "💔",
        name: "a broken-hearted relationship",
    },
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
    EMAIL_REGEX.lastIndex = 0;

    if (EMAIL_REGEX.test(content)) {
        return true;
    }

    URL_REGEX.lastIndex = 0;

    const urls =
        content.match(URL_REGEX) || [];

    return urls.some((rawUrl) => {
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

    const [reactionPicker, setReactionPicker] =
        useState<number | null>(null);

    const reactionPickerRef =
        useRef<HTMLDivElement | null>(null);

    const [showReactionBurst, setShowReactionBurst] =
        useState<{
            id: number;
            type: "comment" | "reply";
            reaction: ReactionType;
        } | null>(null);

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

    const [showCommentForm, setShowCommentForm] =
        useState(false);

    const loadingDots = useLoadingDots();

    useEffect(() => {
        if (reactionPicker === null) {
            return;
        }

        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                reactionPickerRef.current &&
                !reactionPickerRef.current.contains(
                    event.target as Node
                )
            ) {
                setReactionPicker(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [reactionPicker]);

    useEffect(() => {
        let cancelled = false;

        setComments([]);
        setReactionPicker(null);
        setShowReactionBurst(null);

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
                    const pendingComments =
                        previous.filter(
                            (comment) =>
                                comment.id < 0
                        );

                    const mergedComments =
                        fetchedComments.map(
                            (comment) => {
                                const previousComment =
                                    previous.find(
                                        (item) =>
                                            item.id ===
                                            comment.id
                                    );

                                if (
                                    !previousComment
                                ) {
                                    return comment;
                                }

                                const pendingReplies =
                                    previousComment.replies.filter(
                                        (reply) =>
                                            reply.id < 0
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
                            }
                        );

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

                setError(
                    "Could not load comments."
                );
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

        if (
            !content ||
            isSubmittingComment
        ) {
            return;
        }

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

            setShowReplies((previous) =>
                previous.includes(commentId)
                    ? previous
                    : [
                        ...previous,
                        commentId,
                    ]
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

    const toggleCommentReaction = async (
        commentId: number,
        reaction: ReactionType,
        replyId?: number
    ) => {
        const targetComment =
            comments.find(
                (comment) =>
                    comment.id === commentId
            );

        if (!targetComment) return;

        const target =
            replyId !== undefined
                ? targetComment.replies.find(
                    (reply) =>
                        reply.id === replyId
                )
                : targetComment;

        if (!target) return;

        const previousReaction =
            target.userReaction;

        const previousCounts = {
            ...target.reactionCounts,
        };

        const nextReaction =
            previousReaction === reaction
                ? null
                : reaction;

        const nextCounts = {
            ...target.reactionCounts,
        };

        if (previousReaction) {
            nextCounts[previousReaction] =
                Math.max(
                    0,
                    nextCounts[previousReaction] -
                    1
                );
        }

        if (nextReaction) {
            nextCounts[nextReaction] += 1;

            setShowReactionBurst({
                id:
                    replyId !== undefined
                        ? replyId
                        : commentId,
                type:
                    replyId !== undefined
                        ? "reply"
                        : "comment",
                reaction,
            });
        } else {
            setShowReactionBurst(null);
        }

        setComments((previous) =>
            previous.map((comment) => {
                if (
                    replyId === undefined &&
                    comment.id === commentId
                ) {
                    return {
                        ...comment,
                        reactionCounts:
                            nextCounts,
                        userReaction:
                            nextReaction,
                    };
                }

                if (
                    replyId !== undefined &&
                    comment.id === commentId
                ) {
                    return {
                        ...comment,
                        replies:
                            comment.replies.map(
                                (reply) =>
                                    reply.id ===
                                        replyId
                                        ? {
                                            ...reply,
                                            reactionCounts:
                                                nextCounts,
                                            userReaction:
                                                nextReaction,
                                        }
                                        : reply
                            ),
                    };
                }

                return comment;
            })
        );

        setReactionPicker(null);

        try {
            const response =
                await api.post(
                    `/api/posts/${postId}/comments/${replyId ?? commentId
                    }/like`,
                    {
                        reaction,
                    }
                );

            if (
                response.data?.reactionCounts
            ) {
                const serverReaction =
                    response.data
                        .userReaction ??
                    response.data.reaction ??
                    null;

                setComments((previous) =>
                    previous.map((comment) => {
                        if (
                            replyId ===
                            undefined &&
                            comment.id ===
                            commentId
                        ) {
                            return {
                                ...comment,
                                reactionCounts:
                                    response.data
                                        .reactionCounts,
                                userReaction:
                                    serverReaction,
                            };
                        }

                        if (
                            replyId !==
                            undefined &&
                            comment.id ===
                            commentId
                        ) {
                            return {
                                ...comment,
                                replies:
                                    comment.replies.map(
                                        (reply) =>
                                            reply.id ===
                                                replyId
                                                ? {
                                                    ...reply,
                                                    reactionCounts:
                                                        response
                                                            .data
                                                            .reactionCounts,
                                                    userReaction:
                                                        serverReaction,
                                                }
                                                : reply
                                    ),
                            };
                        }

                        return comment;
                    })
                );
            }
        } catch (error) {
            console.error(
                "Failed to update reaction:",
                error
            );

            setComments((previous) =>
                previous.map((comment) => {
                    if (
                        replyId ===
                        undefined &&
                        comment.id ===
                        commentId
                    ) {
                        return {
                            ...comment,
                            reactionCounts:
                                previousCounts,
                            userReaction:
                                previousReaction,
                        };
                    }

                    if (
                        replyId !==
                        undefined &&
                        comment.id ===
                        commentId
                    ) {
                        return {
                            ...comment,
                            replies:
                                comment.replies.map(
                                    (reply) =>
                                        reply.id ===
                                            replyId
                                            ? {
                                                ...reply,
                                                reactionCounts:
                                                    previousCounts,
                                                userReaction:
                                                    previousReaction,
                                            }
                                            : reply
                                ),
                        };
                    }

                    return comment;
                })
            );

            setShowReactionBurst(null);
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
                        {(
                            commentCount +
                            comments.filter(
                                (comment) =>
                                    comment.id < 0
                            ).length
                        ) > 0 && (
                                <span className="ml-2 text-sm font-medium text-muted">
                                    {`(${commentCount +
                                        comments.filter(
                                            (comment) =>
                                                comment.id <
                                                0
                                        ).length
                                        })`}
                                </span>
                            )}
                    </h2>

                    {!showCommentForm && (
                        <button
                            type="button"
                            onClick={() =>
                                setShowCommentForm(
                                    (prev) => !prev
                                )
                            }
                            className="rounded-full border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-[#d4a017] hover:text-[#d4a017]"
                        >
                            Post a Comment
                        </button>
                    )}
                </div>

                {showCommentForm && (
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
                                value={
                                    commentAuthor
                                }
                                onChange={(event) =>
                                    setCommentAuthor(
                                        event.target.value
                                    )
                                }
                                placeholder="Your name"
                                disabled={
                                    isSubmittingComment
                                }
                                className="mb-2 w-full rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                            />

                            <textarea
                                value={
                                    commentText
                                }
                                onChange={(event) =>
                                    setCommentText(
                                        event.target.value
                                    )
                                }
                                placeholder="Add a comment..."
                                rows={3}
                                disabled={
                                    isSubmittingComment
                                }
                                className="w-full resize-y rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-[#d4a017] disabled:opacity-60"
                            />

                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCommentForm(
                                            (prev) =>
                                                !prev
                                        )
                                    }
                                    className="rounded-full px-4 py-2 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        addComment
                                    }
                                    disabled={
                                        !commentText.trim() ||
                                        isSubmittingComment
                                    }
                                    className="rounded-full bg-[#d4a017] px-4 py-2 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isSubmittingComment ? (
                                        <span className="inline-flex min-w-[82px] items-center justify-start">
                                            <span>
                                                Submitting
                                            </span>

                                            <span className="w-[18px] text-left">
                                                {
                                                    loadingDots
                                                }
                                            </span>
                                        </span>
                                    ) : (
                                        "Comment"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="ml-[48px] mt-4 w-[calc(100%-48px)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6 space-y-6">
                    {isLoading ? (
                        <p className="py-6 text-center text-sm text-muted">
                            <span className="inline-flex min-w-[82px] items-center justify-start">
                                <span>
                                    Loading comments
                                </span>

                                <span className="w-[18px] text-left">
                                    {
                                        loadingDots
                                    }
                                </span>
                            </span>
                        </p>
                    ) : (
                        <>
                            {comments.map(
                                (comment) => {
                                    const reactionSummary =
                                        getReactionSummary(
                                            comment
                                        );

                                    return (
                                        <div
                                            key={
                                                comment.id
                                            }
                                        >
                                            <div className="flex gap-3">
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

                                                    <div className="mt-2 flex items-center gap-4 px-2 text-xs font-semibold text-muted">
                                                        {/* Like button + reaction picker */}
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReactionPicker(
                                                                        (previous) =>
                                                                            previous === comment.id
                                                                                ? null
                                                                                : comment.id
                                                                    )
                                                                }
                                                                className={`cursor-pointer inline-flex items-center gap-1 transition-colors ${comment.userReaction
                                                                    ? "text-[#d4a017]"
                                                                    : "text-muted hover:text-[#d4a017]"
                                                                    }`}
                                                            >
                                                                <motion.span
                                                                    whileHover={{
                                                                        scale: 1.45,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.15,
                                                                    }}
                                                                    className="inline-block origin-center"
                                                                >
                                                                    {comment.userReaction
                                                                        ? getReactionMeta(
                                                                            comment.userReaction
                                                                        ).emoji
                                                                        : "👍"}
                                                                </motion.span>

                                                                <span>
                                                                    {comment.userReaction
                                                                        ? getReactionMeta(
                                                                            comment.userReaction
                                                                        ).label
                                                                        : "Like"}
                                                                </span>
                                                            </button>

                                                            {reactionPicker ===
                                                                comment.id && (
                                                                    <div
                                                                        ref={
                                                                            reactionPickerRef
                                                                        }
                                                                        className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-lg"
                                                                    >
                                                                        {REACTIONS.map(
                                                                            (
                                                                                reaction
                                                                            ) => (
                                                                                <button
                                                                                    key={
                                                                                        reaction.type
                                                                                    }
                                                                                    type="button"
                                                                                    title={
                                                                                        reaction.label
                                                                                    }
                                                                                    aria-label={
                                                                                        reaction.label
                                                                                    }
                                                                                    onClick={() =>
                                                                                        toggleCommentReaction(
                                                                                            comment.id,
                                                                                            reaction.type
                                                                                        )
                                                                                    }
                                                                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs leading-none transition-all duration-150 ${comment.userReaction ===
                                                                                        reaction.type
                                                                                        ? "bg-[#d4a017]/25"
                                                                                        : "hover:bg-[#d4a017]/25"
                                                                                        }`}
                                                                                >
                                                                                    <motion.span
                                                                                        whileHover={{
                                                                                            scale: 1.45,
                                                                                        }}
                                                                                        transition={{
                                                                                            duration: 0.15,
                                                                                        }}
                                                                                        className="inline-flex translate-x-[1px] origin-center items-center justify-center leading-none"
                                                                                    >
                                                                                        {
                                                                                            reaction.emoji
                                                                                        }
                                                                                    </motion.span>
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>

                                                        {/* Reaction summary — display only */}
                                                        {reactionSummary.length > 0 && (
                                                            <span className="inline-flex items-center gap-0">
                                                                <span className="text-muted">
                                                                    {reactionSummary.length === 1
                                                                        ? "Reaction"
                                                                        : "Reactions"}
                                                                </span>

                                                                <span className="inline-flex items-center gap-1">
                                                                    {reactionSummary.map(
                                                                        (reaction) => (
                                                                            <span
                                                                                key={reaction.type}
                                                                                className={`inline-flex items-center gap-1 ${comment.userReaction ===
                                                                                    reaction.type
                                                                                    ? "text-[#d4a017]"
                                                                                    : ""
                                                                                    }`}
                                                                                title={reaction.label}
                                                                            >
                                                                                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                                                                                    {showReactionBurst?.id ===
                                                                                        comment.id &&
                                                                                        showReactionBurst.type ===
                                                                                        "comment" &&
                                                                                        showReactionBurst.reaction ===
                                                                                        reaction.type && (
                                                                                            <span
                                                                                                className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0"
                                                                                                onAnimationEnd={() =>
                                                                                                    setShowReactionBurst(
                                                                                                        null
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {Array.from({
                                                                                                    length: 10,
                                                                                                }).map(
                                                                                                    (_, index) => {
                                                                                                        const reactionMeta =
                                                                                                            getReactionMeta(
                                                                                                                showReactionBurst.reaction
                                                                                                            );

                                                                                                        return (
                                                                                                            <span
                                                                                                                key={
                                                                                                                    index
                                                                                                                }
                                                                                                                className={`like-reaction like-reaction-${index + 1}`}
                                                                                                            >
                                                                                                                {
                                                                                                                    reactionMeta.emoji
                                                                                                                }
                                                                                                            </span>
                                                                                                        );
                                                                                                    }
                                                                                                )}
                                                                                            </span>
                                                                                        )}

                                                                                    <span className="text-xs leading-none cursor-pointer">
                                                                                        <motion.span
                                                                                            whileHover={{
                                                                                                scale: 1.45,
                                                                                            }}
                                                                                            transition={{
                                                                                                duration: 0.15,
                                                                                            }}
                                                                                            className="inline-block"
                                                                                        >
                                                                                            {reaction.emoji}
                                                                                        </motion.span>
                                                                                    </span>
                                                                                </span>

                                                                                <span className="text-xs leading-none">
                                                                                    {
                                                                                        comment
                                                                                            .reactionCounts[
                                                                                        reaction.type
                                                                                        ]
                                                                                    }
                                                                                </span>
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </span>
                                                            </span>
                                                        )}

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
                                                                        : `View ${comment.replies.length} ${comment.replies.length ===
                                                                            1
                                                                            ? "reply"
                                                                            : "replies"
                                                                        }`}
                                                                </button>
                                                            )}
                                                    </div>

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
                                                                        value={
                                                                            replyText
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            setReplyText(
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="Write a reply..."
                                                                        rows={
                                                                            2
                                                                        }
                                                                        disabled={
                                                                            isSubmittingReply !==
                                                                            null
                                                                        }
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
                                                                                addReply(
                                                                                    comment.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !replyText.trim() ||
                                                                                isSubmittingReply !==
                                                                                null
                                                                            }
                                                                            className="rounded-full bg-[#d4a017] px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                                                        >
                                                                            {isSubmittingReply ===
                                                                                comment.id ? (
                                                                                <span className="inline-flex min-w-[58px] items-center justify-start">
                                                                                    <span>
                                                                                        Submitting
                                                                                    </span>

                                                                                    <span className="w-[18px] text-left">
                                                                                        {
                                                                                            loadingDots
                                                                                        }
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
                                                                    ) => {
                                                                        const replyReactionSummary =
                                                                            getReactionSummary(
                                                                                reply
                                                                            );

                                                                        return (
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

                                                                                    <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-muted">
                                                                                        {/* Like button + reaction picker */}
                                                                                        <div className="relative">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    setReactionPicker(
                                                                                                        (previous) =>
                                                                                                            previous === reply.id
                                                                                                                ? null
                                                                                                                : reply.id
                                                                                                    )
                                                                                                }
                                                                                                className={`cursor-pointer inline-flex items-center gap-1 transition-colors ${reply.userReaction
                                                                                                    ? "text-[#d4a017]"
                                                                                                    : "text-muted hover:text-[#d4a017]"
                                                                                                    }`}
                                                                                            >
                                                                                                <motion.span
                                                                                                    whileHover={{
                                                                                                        scale: 1.45,
                                                                                                    }}
                                                                                                    transition={{
                                                                                                        duration: 0.15,
                                                                                                    }}
                                                                                                    className="inline-block origin-center"
                                                                                                >
                                                                                                    {reply.userReaction
                                                                                                        ? getReactionMeta(
                                                                                                            reply.userReaction
                                                                                                        ).emoji
                                                                                                        : "👍"}
                                                                                                </motion.span>

                                                                                                <span>
                                                                                                    {reply.userReaction
                                                                                                        ? getReactionMeta(
                                                                                                            reply.userReaction
                                                                                                        ).label
                                                                                                        : "Like"}
                                                                                                </span>
                                                                                            </button>

                                                                                            {reactionPicker ===
                                                                                                reply.id && (
                                                                                                    <div
                                                                                                        ref={
                                                                                                            reactionPickerRef
                                                                                                        }
                                                                                                        className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-lg"
                                                                                                    >
                                                                                                        {REACTIONS.map(
                                                                                                            (
                                                                                                                reaction
                                                                                                            ) => (
                                                                                                                <button
                                                                                                                    key={
                                                                                                                        reaction.type
                                                                                                                    }
                                                                                                                    type="button"
                                                                                                                    title={
                                                                                                                        reaction.label
                                                                                                                    }
                                                                                                                    aria-label={
                                                                                                                        reaction.label
                                                                                                                    }
                                                                                                                    onClick={() =>
                                                                                                                        toggleCommentReaction(
                                                                                                                            comment.id,
                                                                                                                            reaction.type,
                                                                                                                            reply.id
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs leading-none transition-all duration-150 ${reply.userReaction ===
                                                                                                                        reaction.type
                                                                                                                        ? "bg-[#d4a017]/25"
                                                                                                                        : "hover:bg-[#d4a017]/25"
                                                                                                                        }`}
                                                                                                                >
                                                                                                                    <motion.span
                                                                                                                        whileHover={{
                                                                                                                            scale: 1.45,
                                                                                                                        }}
                                                                                                                        transition={{
                                                                                                                            duration: 0.15,
                                                                                                                        }}
                                                                                                                        className="inline-flex translate-x-[1px] origin-center items-center justify-center leading-none"
                                                                                                                    >
                                                                                                                        {
                                                                                                                            reaction.emoji
                                                                                                                        }
                                                                                                                    </motion.span>
                                                                                                                </button>
                                                                                                            )
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                        </div>

                                                                                        {/* Reaction summary — display only */}
                                                                                        {replyReactionSummary.length > 0 && (
                                                                                            <span className="inline-flex items-center gap-0">
                                                                                                <span className="text-muted">
                                                                                                    {replyReactionSummary.length === 1
                                                                                                        ? "Reaction"
                                                                                                        : "Reactions"}
                                                                                                </span>

                                                                                                <span className="inline-flex items-center gap-1">
                                                                                                    {replyReactionSummary.map(
                                                                                                        (reaction) => (
                                                                                                            <span
                                                                                                                key={reaction.type}
                                                                                                                className={`inline-flex items-center gap-1 ${reply.userReaction ===
                                                                                                                    reaction.type
                                                                                                                    ? "text-[#d4a017]"
                                                                                                                    : ""
                                                                                                                    }`}
                                                                                                                title={reaction.label}
                                                                                                            >
                                                                                                                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                                                                                                                    {showReactionBurst?.id ===
                                                                                                                        reply.id &&
                                                                                                                        showReactionBurst.type ===
                                                                                                                        "reply" &&
                                                                                                                        showReactionBurst.reaction ===
                                                                                                                        reaction.type && (
                                                                                                                            <span
                                                                                                                                className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0"
                                                                                                                                onAnimationEnd={() =>
                                                                                                                                    setShowReactionBurst(
                                                                                                                                        null
                                                                                                                                    )
                                                                                                                                }
                                                                                                                            >
                                                                                                                                {Array.from({
                                                                                                                                    length: 10,
                                                                                                                                }).map(
                                                                                                                                    (_, index) => {
                                                                                                                                        const reactionMeta =
                                                                                                                                            getReactionMeta(
                                                                                                                                                showReactionBurst.reaction
                                                                                                                                            );

                                                                                                                                        return (
                                                                                                                                            <span
                                                                                                                                                key={
                                                                                                                                                    index
                                                                                                                                                }
                                                                                                                                                className={`like-reaction like-reaction-${index + 1}`}
                                                                                                                                            >
                                                                                                                                                {
                                                                                                                                                    reactionMeta.emoji
                                                                                                                                                }
                                                                                                                                            </span>
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                )}
                                                                                                                            </span>
                                                                                                                        )}

                                                                                                                    <span className="text-xs leading-none cursor-pointer">
                                                                                                                        <motion.span
                                                                                                                            whileHover={{
                                                                                                                                scale: 1.45,
                                                                                                                            }}
                                                                                                                            transition={{
                                                                                                                                duration: 0.15,
                                                                                                                            }}
                                                                                                                            className="inline-block"
                                                                                                                        >
                                                                                                                            {reaction.emoji}
                                                                                                                        </motion.span>
                                                                                                                    </span>
                                                                                                                </span>

                                                                                                                <span className="text-xs leading-none">
                                                                                                                    {
                                                                                                                        reply
                                                                                                                            .reactionCounts[
                                                                                                                        reaction.type
                                                                                                                        ]
                                                                                                                    }
                                                                                                                </span>
                                                                                                            </span>
                                                                                                        )
                                                                                                    )}
                                                                                                </span>
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
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