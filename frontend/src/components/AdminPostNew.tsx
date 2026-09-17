import { useEffect, useState } from "react";
import {
    ArrowLeft,
} from "lucide-react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import { api } from "../api";
import type { Category, Tag } from "../types";
import { useLoadingDots } from "../hooks/useLoadingDots";
import PostForm from "./PostForm";

export default function AdminPostNew() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        async function loadMeta() {
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const [c, t] = await Promise.all([
                    api.get<Category[]>("/api/meta/categories"),
                    api.get<Tag[]>("/api/meta/tags"),
                ]);

                setCategories(c.data);
                setTags(t.data);
            } catch {
                navigate("/admin/login");
            } finally {
                setLoading(false);
            }
        }

        loadMeta();
    }, []);

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
                    New Post
                </h1>

                <p className="mt-2 text-slate">
                    Create a new blog post.
                </p>
            </div>

            <PostForm
                post={null}
                categories={categories}
                tags={tags}
                headers={headers}
                onSaved={() => navigate("/admin/posts")}
                onCancel={() => navigate("/admin/posts")}
            />
        </section>
    );
}