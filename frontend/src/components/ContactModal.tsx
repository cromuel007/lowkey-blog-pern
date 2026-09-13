import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';
import {
    Mail,
    MapPin,
    Send,
    X,
} from 'lucide-react';

const API_URL =
    import.meta.env.VITE_API_URL2 || 'http://localhost:3001';

interface ContactForm {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface Status {
    loading: boolean;
    success: string;
    error: string;
}

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactModal({
    isOpen,
    onClose,
}: ContactModalProps) {
    const [form, setForm] = useState<ContactForm>({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [status, setStatus] = useState<Status>({
        loading: false,
        success: '',
        error: '',
    });

    if (!isOpen) {
        return null;
    }

    const updateForm = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const submitContact = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setStatus({
            loading: true,
            success: '',
            error: '',
        });

        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const data: { message?: string } =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to send message.',
                );
            }

            setForm({
                name: '',
                email: '',
                subject: '',
                message: '',
            });

            setStatus({
                loading: false,
                success:
                    data.message ||
                    'Thank you! Your message has been sent.',
                error: '',
            });

            /*
             * Close after the success message
             * has been visible briefly.
             */
            setTimeout(() => {
                onClose();

                setStatus({
                    loading: false,
                    success: '',
                    error: '',
                });
            }, 1800);
        } catch (error: unknown) {
            setStatus({
                loading: false,
                success: '',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to send message.',
            });
        }
    };

    const inputClasses =
        'w-full mt-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !status.loading
                ) {
                    onClose();
                }
            }}
        >
            <div className="modal-slide-up relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-ink">
                            Let's Work Together
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (!status.loading) {
                                onClose();
                            }
                        }}
                        aria-label="Close contact form"
                        disabled={status.loading}
                        className="-mr-3 flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-[0.8fr_1.2fr]">
                    {/* Contact information */}
                    <div className="hidden md:block">
                        <h3 className="text-sm font-bold text-ink">
                            Get in touch
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate">
                            Have a project you'd like to discuss? Send me a
                            message and I'll get back to you.
                        </p>

                        <div className="mt-5 space-y-3">
                            <p className="flex items-center gap-2 text-sm text-slate">
                                <MapPin className="h-4 w-4 shrink-0" />
                                Davao City, Philippines
                            </p>

                            <a
                                href="mailto:cromuel@me.com"
                                className="flex items-center gap-2 text-sm text-slate transition-colors hover:text-accent"
                            >
                                <Mail className="h-4 w-4 shrink-0" />
                                cromuel@me.com
                            </a>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submitContact}>
                        <label className="mb-4 block text-sm font-semibold text-ink">
                            Name *

                            <input
                                className={inputClasses}
                                name="name"
                                placeholder="Your name"
                                value={form.name}
                                onChange={updateForm}
                                required
                                disabled={status.loading}
                            />
                        </label>

                        <label className="mb-4 block text-sm font-semibold text-ink">
                            Email *

                            <input
                                className={inputClasses}
                                type="email"
                                name="email"
                                placeholder="Your email"
                                value={form.email}
                                onChange={updateForm}
                                required
                                disabled={status.loading}
                            />
                        </label>

                        <label className="mb-4 block text-sm font-semibold text-ink">
                            Subject

                            <input
                                className={inputClasses}
                                name="subject"
                                placeholder="Subject or topic"
                                value={form.subject}
                                onChange={updateForm}
                                disabled={status.loading}
                            />
                        </label>

                        <label className="mb-4 block text-sm font-semibold text-ink">
                            Message *

                            <textarea
                                className={`${inputClasses} resize-y`}
                                name="message"
                                placeholder="Write something nice..."
                                rows={5}
                                value={form.message}
                                onChange={updateForm}
                                required
                                disabled={status.loading}
                            />
                        </label>

                        {status.success && (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                {status.success}
                            </div>
                        )}

                        {status.error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {status.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status.loading}
                            className="mt-2 mb-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />

                            {status.loading
                                ? 'Sending...'
                                : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

