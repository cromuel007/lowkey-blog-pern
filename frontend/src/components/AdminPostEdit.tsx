import { useEffect, useState } from "react";
import {
    ArrowLeft,
} from "lucide-react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";
import { api } from "../api";
import type { Category, Post, Tag } from "../types";
import { useLoadingDots } from "../hooks/useLoadingDots";
import PostForm from "./PostForm";

export default function AdminPostEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [post, setPost] = useState<Post | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        async function load() {
            if (!token) {
                navigate("/admin/login");
                return;
            }

            if (!id) {
                setError("Post not found.");
                setLoading(false);
                return;
            }

            try {
                const [
                    postResponse,
                    categoriesResponse,
                    tagsResponse,
                ] = await Promise.all([
                    api.get<Post>(`/api/posts/${id}`, {
                        headers,
                    }),
                    api.get<Category[]>("/api/meta/categories"),
                    api.get<Tag[]>("/api/meta/tags"),
                ]);

                setPost(postResponse.data);
                setCategories(categoriesResponse.data);
                setTags(tagsResponse.data);
            } catch {
                setError("Could not load post.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    if (!token || loading) {
        return (
            <p className="py-10 text-center text-slate">
                Loading
                <span className="inline-block w-[18px] text-left">
                    {loadingDots}
                </span>
            </p>
        );
    }

    if (error || !post) {
        return (
            <section>
                <Link
                    to="/admin/posts"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </Link>

                <div className="mt-8 rounded-lg border border-red-100 bg-red-50 p-7 text-center">
                    <p className="font-medium text-danger">
                        {error || "Post not found."}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="mb-8">
                <Link
                    to="/admin/posts"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </Link>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    CONTENT
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    Edit Post
                </h1>

                <p className="mt-2 text-slate">
                    Update your blog post.
                </p>
            </div>

            <PostForm
                post={post}
                categories={categories}
                tags={tags}
                headers={headers}
                onSaved={() => navigate("/admin/posts")}
                onCancel={() => navigate("/admin/posts")}
            />
        </section>
    );
}