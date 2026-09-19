import { useState } from "react";
import { Heart, ThumbsUp, MessageCircle, Reply } from "lucide-react";

type Comment = {
    id: number;
    author: string;
    content: string;
    likes: number;
    liked: boolean;
    replies: Comment[];
};

type CommentsProps = {
    initialCount?: number;
};

export default function Comments({ initialCount = 0 }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");
    const [showReplies, setShowReplies] = useState<number[]>([]);
    const [showLikeBurst, setShowLikeBurst] = useState<number | null>(null);

    const addComment = () => {
        const content = commentText.trim();

        if (!content) return;

        const newComment: Comment = {
            id: Date.now(),
            author: "You",
            content,
            likes: 0,
            liked: false,
            replies: [],
        };

        setComments((previous) => [newComment, ...previous]);
        setCommentText("");
    };

    const addReply = (commentId: number) => {
        const content = replyText.trim();

        if (!content) return;

        const newReply: Comment = {
            id: Date.now(),
            author: "You",
            content,
            likes: 0,
            liked: false,
            replies: [],
        };

        setComments((previous) =>
            previous.map((comment) =>
                comment.id === commentId
                    ? {
                        ...comment,
                        replies: [...comment.replies, newReply],
                    }
                    : comment
            )
        );

        setReplyText("");
        setReplyingTo(null);

        setShowReplies((previous) =>
            previous.includes(commentId)
                ? previous
                : [...previous, commentId]
        );
    };

    const toggleCommentLike = (
        commentId: number,
        replyId?: number
    ) => {
        setComments((previous) =>
            previous.map((comment) => {
                if (
                    replyId !== undefined &&
                    comment.id === commentId
                ) {
                    return {
                        ...comment,
                        replies: comment.replies.map((reply) =>
                            reply.id === replyId
                                ? {
                                    ...reply,
                                    liked: !reply.liked,
                                    likes: reply.liked
                                        ? reply.likes - 1
                                        : reply.likes + 1,
                                }
                                : reply
                        ),
                    };
                }

                if (comment.id === commentId) {
                    return {
                        ...comment,
                        liked: !comment.liked,
                        likes: comment.liked
                            ? comment.likes - 1
                            : comment.likes + 1,
                    };
                }

                return comment;
            })
        );
    };

    const toggleReplies = (commentId: number) => {
        setShowReplies((previous) =>
            previous.includes(commentId)
                ? previous.filter((id) => id !== commentId)
                : [...previous, commentId]
        );
    };

    return (
        <div className="mt-8 border-t border-line pt-6">
            <div className="mx-auto max-w-[760px]">
                <h2 className="mb-5 text-xl font-bold text-ink">
                    Comments
                </h2>

                {/* New comment */}
                <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4a017] text-sm font-bold text-white">
                        Y
                    </div>

                    <div className="flex-1">
                        <textarea
                            value={commentText}
                            onChange={(event) =>
                                setCommentText(event.target.value)
                            }
                            placeholder="Add a comment..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-[#d4a017]"
                        />

                        <div className="mt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={addComment}
                                disabled={!commentText.trim()}
                                className="rounded-full bg-[#d4a017] px-4 py-2 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments */}
                <div className="mt-8 space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id}>
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-ink">
                                    {comment.author.charAt(0)}
                                </div>

                                <div className="min-w-0 flex-1">
                                    {/* Comment */}
                                    <div className="rounded-xl bg-surface-alt px-4 py-3">
                                        <div className="text-sm font-bold text-ink">
                                            {comment.author}
                                        </div>

                                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                                            {comment.content}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-2 flex items-center gap-4 px-2 text-xs font-semibold text-muted">
                                        {/* Like */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!comment.liked) {
                                                    setShowLikeBurst(comment.id);
                                                }

                                                toggleCommentLike(comment.id);
                                            }}
                                            className={`transition-colors hover:text-[#d4a017] ${comment.liked ? "text-[#d4a017]" : ""
                                                }`}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                                    {showLikeBurst === comment.id && (
                                                        <span
                                                            className="pointer-events-none absolute inset-0 z-20"
                                                            onAnimationEnd={() => setShowLikeBurst(null)}
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
                                                {comment.likes > 0 && ` · ${comment.likes}`}
                                            </span>
                                        </button>

                                        {/* Reply */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReplyingTo(comment.id);
                                                setReplyText("");
                                            }}
                                            className="transition-colors hover:text-[#d4a017]"
                                        >
                                            Reply
                                        </button>

                                        {/* Replies */}
                                        {comment.replies.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => toggleReplies(comment.id)}
                                                className="transition-colors hover:text-[#d4a017]"
                                            >
                                                {showReplies.includes(comment.id)
                                                    ? "Hide replies"
                                                    : `View ${comment.replies.length} ${comment.replies.length === 1
                                                        ? "reply"
                                                        : "replies"
                                                    }`}
                                            </button>
                                        )}
                                    </div>

                                    {/* Reply input */}
                                    {replyingTo === comment.id && (
                                        <div className="mt-4 flex gap-3 pl-2">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4a017] text-xs font-bold text-white">
                                                Y
                                            </div>

                                            <div className="flex-1">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(event) =>
                                                        setReplyText(
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Write a reply..."
                                                    rows={2}
                                                    className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-[#d4a017]"
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
                                                        }}
                                                        className="rounded-full px-3 py-1.5 text-xs font-bold text-muted hover:text-ink"
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
                                                            !replyText.trim()
                                                        }
                                                        className="rounded-full bg-[#d4a017] px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies */}
                                    {showReplies.includes(
                                        comment.id
                                    ) &&
                                        comment.replies.length > 0 && (
                                            <div className="mt-4 ml-5 space-y-4 border-l-2 border-line pl-4">
                                                {comment.replies.map(
                                                    (reply) => (
                                                        <div
                                                            key={
                                                                reply.id
                                                            }
                                                            className="flex gap-3"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-ink">
                                                                {reply.author.charAt(
                                                                    0
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="rounded-xl bg-surface-alt px-4 py-3">
                                                                    <div className="text-sm font-bold text-ink">
                                                                        {
                                                                            reply.author
                                                                        }
                                                                    </div>

                                                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                                                                        {
                                                                            reply.content
                                                                        }
                                                                    </p>
                                                                </div>
                                                                {/* Like */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!reply.liked) {
                                                                            setShowLikeBurst(reply.id);
                                                                        }

                                                                        toggleCommentLike(comment.id, reply.id);
                                                                    }}
                                                                    className={`text-xs font-semibold transition-colors hover:text-[#d4a017] ${reply.liked ? "text-[#d4a017]" : "text-muted"
                                                                        }`}
                                                                >
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                                                            {showLikeBurst === reply.id && (
                                                                                <span
                                                                                    className="pointer-events-none absolute inset-0 z-20"
                                                                                    onAnimationEnd={() => setShowLikeBurst(null)}
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
                                                                        {reply.likes > 0 && ` · ${reply.likes}`}
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
                    ))}

                    {comments.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted">
                            No comments yet. Be the first to share your
                            thoughts.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}