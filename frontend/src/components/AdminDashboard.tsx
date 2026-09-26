import { useState } from "react";
import { motion } from "motion/react";
import {
    ArrowRight,
    Bot,
    ExternalLink,
    FileText,
    Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLoadingDots } from "../hooks/useLoadingDots";

const API_URL = import.meta.env.VITE_API_URL;

type ResearchItem = {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    reason?: string;
};

export default function AdminDashboard() {
    const [researching, setResearching] = useState(false);
    const [researchStatus, setResearchStatus] = useState<string | null>(null);
    const [researchError, setResearchError] = useState<string | null>(null);
    const [researchResults, setResearchResults] = useState<ResearchItem[]>([]);
    const loadingDots = useLoadingDots();

    const activateAIResearch = async () => {
        setResearching(true);
        setResearchStatus(null);
        setResearchError(null);
        setResearchResults([]);

        try {
            const token = localStorage.getItem("blog_token");

            const response = await fetch(
                `${API_URL}/api/ai/research`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const responseText = await response.text();

            let data: {
                success?: boolean;
                error?: string;
                discovered?: number;
                saved?: number;
                skipped?: number;
                posts?: ResearchItem[];
                skippedPosts?: ResearchItem[];
            };

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `API returned ${response.status}: ${responseText || "empty response"
                    }`,
                );
            }

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    `AI research failed (${response.status}).`,
                );
            }

            const results = [
                ...(data.posts ?? []),
                ...(data.skippedPosts ?? []),
            ];

            setResearchResults(results);

            setResearchStatus(
                `Research completed. ${data.discovered ?? 0} discovered, ${data.saved ?? 0
                } saved.`,
            );
        } catch (error) {
            setResearchError(
                error instanceof Error
                    ? error.message
                    : "AI research failed.",
            );
        } finally {
            setResearching(false);
        }
    };

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
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
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

                <div className="rounded-lg bg-white px-7 py-8 shadow-sm md:col-span-2">
                    <div className="relative w-fit">
                        <motion.div
                            animate={
                                researching
                                    ? {
                                        y: [0, -4, 0],
                                        rotate: [0, -6, 6, 0],
                                        scale: [1, 1.08, 1],
                                    }
                                    : {
                                        y: 0,
                                        rotate: 0,
                                        scale: 1,
                                    }
                            }
                            transition={
                                researching
                                    ? {
                                        duration: 1.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }
                                    : {
                                        duration: 0.3,
                                    }
                            }
                            className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"
                        >
                            <Bot className="h-6 w-6" />
                        </motion.div>

                        {researching && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.8,
                                }}
                                animate={{
                                    opacity: [0, 0.6, 0],
                                    scale: [0.8, 1.5, 1.8],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                }}
                                className="absolute inset-0 rounded-xl border border-accent"
                            />
                        )}
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-ink">
                        AI Research
                    </h2>

                    <p className="mt-2 leading-7 text-slate">
                        {researching ? (
                            <>
                                AI is doing the work for you. Please try to look busy.{" "}
                                <motion.span
                                    className="inline-block text-2xl"
                                    animate={{
                                        rotate: [-15, 15, -15],
                                        x: [-3, 3, -3],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    🤖
                                </motion.span>
                            </>
                        ) : (
                            <>
                                Ask AI to do the research. It reads the internet so you can pretend
                                you already knew about it.{" "}
                                <motion.span
                                    className="inline-block text-2xl"
                                    animate={{
                                        rotate: [-10, 10, -10],
                                        y: [0, -4, 0],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    🧠
                                </motion.span>
                            </>
                        )}
                    </p>


                    <button
                        type="button"
                        onClick={activateAIResearch}
                        disabled={researching}
                        className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {researching ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />

                                <div className="text-sm font-semibold">
                                    <span>Researching</span>
                                    <span className="inline-block w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                Activate AI Research
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    {researchStatus && (
                        <div className="mt-5 rounded-lg bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
                            {researchStatus}
                        </div>
                    )}

                    {researchError && (
                        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {researchError}
                        </div>
                    )}

                    {researchResults.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate">
                                Discovered
                            </h3>

                            {researchResults.map((item, index) => (
                                <div
                                    key={`${item.url}-${index}`}
                                    className="rounded-lg border border-line bg-surface-alt p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-ink">
                                                {item.title}
                                            </h4>

                                            <p className="mt-1 text-sm text-slate">
                                                {item.source}
                                            </p>

                                            {item.publishedAt && (
                                                <p className="mt-1 text-xs text-slate">
                                                    Published:{" "}
                                                    {new Date(
                                                        item.publishedAt,
                                                    ).toLocaleString()}
                                                </p>
                                            )}

                                            {item.reason && (
                                                <p className="mt-2 text-xs font-medium text-slate">
                                                    Skipped: {item.reason}
                                                </p>
                                            )}
                                        </div>

                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                                            >
                                                View source
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}