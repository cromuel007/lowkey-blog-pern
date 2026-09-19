import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useLoadingDots } from "../hooks/useLoadingDots";

type Admin = {
    id: number;
    email: string;
    createdAt: string;
    updatedAt: string;
};

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const loadingDots = useLoadingDots();

    const token = localStorage.getItem("blog_token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        if (!isEdit) {
            return;
        }

        async function loadAdmin() {
            try {
                const { data } = await api.get<Admin>(
                    `/api/admins/${id}`,
                    {
                        headers,
                    }
                );

                setEmail(data.email);
            } catch {
                navigate("/admin/users");
            } finally {
                setLoading(false);
            }
        }

        loadAdmin();
    }, [id, isEdit]);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!email.trim()) {
            setMessage("Admin email is required.");
            return;
        }

        if (!isEdit && !password) {
            setMessage("Admin password is required.");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            if (isEdit) {
                const data: {
                    email: string;
                    password?: string;
                } = {
                    email: email.trim().toLowerCase(),
                };

                if (password) {
                    data.password = password;
                }

                await api.put(
                    `/api/admins/${id}`,
                    data,
                    {
                        headers,
                    }
                );

                setMessage("User updated.");

                setTimeout(() => {
                    navigate("/admin/users");
                }, 700);
            } else {
                await api.post(
                    "/api/admins",
                    {
                        email: email.trim().toLowerCase(),
                        password,
                    },
                    {
                        headers,
                    }
                );

                setMessage("User created.");

                setTimeout(() => {
                    navigate("/admin/users");
                }, 700);
            }
        } catch (error: any) {
            const responseMessage =
                error?.response?.data?.message;

            setMessage(
                responseMessage ||
                `Could not ${isEdit ? "update" : "create"
                } user.`
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <section>
                <div className="flex min-h-[300px] items-center justify-center">
                    <div className="text-sm font-semibold text-muted">
                        <span>Loading</span>

                        <span className="inline-block w-[18px] text-left">
                            {loadingDots}
                        </span>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section>
            {message && (
                <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#d4a017] bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg">
                    {message}
                </div>
            )}

            <div className="mb-8">
                <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </Link>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                    ADMINISTRATION
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    {isEdit ? "Edit User Admin" : "New User Admin"}
                </h1>

                <p className="mt-2 text-slate">
                    {isEdit
                        ? "Update the admin user's details."
                        : "Create a new admin user."}
                </p>
            </div>

            <div className="max-w-2xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div>
                        <label
                            htmlFor="admin-email"
                            className="mb-2 block text-sm font-semibold text-ink"
                        >
                            Email
                        </label>

                        <input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="e.g. admin@example.com"
                            disabled={saving}
                            autoComplete="email"
                            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:bg-surface"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="admin-password"
                            className="mb-2 block text-sm font-semibold text-ink"
                        >
                            Password
                        </label>

                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder={
                                isEdit
                                    ? "Leave blank to keep current password"
                                    : "Enter password"
                            }
                            disabled={saving}
                            autoComplete={
                                isEdit
                                    ? "new-password"
                                    : "new-password"
                            }
                            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:bg-surface"
                        />

                        {isEdit && (
                            <p className="mt-2 text-xs text-muted">
                                Leave the password blank if you do not
                                want to change it.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-start gap-3 border-t border-line pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="inline-flex items-center">
                                    <span>
                                        {isEdit
                                            ? "Updating"
                                            : "Creating"}
                                    </span>

                                    <span className="w-[18px] text-left">
                                        {loadingDots}
                                    </span>
                                </span>
                            ) : (
                                <>
                                    {isEdit
                                        ? "Update User"
                                        : "Create User"}
                                </>
                            )}
                        </button>

                        <Link
                            to="/admin/users"
                            className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </section>
    );
}