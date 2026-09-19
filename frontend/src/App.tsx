import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminPosts from "./components/AdminPosts";
import AdminComments from "./components/AdminComments";
import AdminPostNew from "./components/AdminPostNew";
import AdminPostEdit from "./components/AdminPostEdit";

import AdminCategories from "./components/AdminCategories";
import AdminCategoriesForm from "./components/AdminCategoriesForm";

import AdminTags from "./components/AdminTags";
import AdminTagsForm from "./components/AdminTagsForm";

import AdminUsers from "./components/AdminUsers";
import AdminUsersForm from "./components/AdminUsersForm";

import Home from "./components/Home";
import PostPage from "./components/PostPage";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ContactModal from "./components/ContactModal";
import { ChevronUp } from "lucide-react";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isAdmin =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  const isAdminLogin = location.pathname === "/admin/login";
  const token = localStorage.getItem("blog_token");

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Admin login has its own standalone UI.
  if (isAdminLogin) {
    return <>{children}</>;
  }

  // Protect all other admin routes.
  if (isAdmin && !token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated admin pages use the admin layout.
  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Public pages use the public layout.
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Navbar onContactClick={() => setIsContactOpen(true)} />

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4">
        {children}
      </main>

      <Footer />

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full text-slate transition-all hover:bg-slate-200 hover:text-accent md:flex"
        >
          <ChevronUp className="h-8 w-8" />
        </button>
      )}

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/posts/:slug" element={<PostPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/posts/new" element={<AdminPostNew />} />
        <Route path="/admin/posts/:id/edit" element={<AdminPostEdit />} />

        {/* Admin Manage Comments */}
        <Route path="/admin/comments" element={<AdminComments />} />

        {/* Admin Manage Categories */}
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/categories/new" element={<AdminCategoriesForm />} />
        <Route path="/admin/categories/:id/edit" element={<AdminCategoriesForm />} />

        {/* Admin Manage Tags */}
        <Route path="/admin/tags" element={<AdminTags />} />
        <Route path="/admin/tags/new" element={<AdminTagsForm />} />
        <Route path="/admin/tags/:id/edit" element={<AdminTagsForm />} />

        {/* Admin Manage Users */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/new" element={<AdminUsersForm />} />
        <Route path="/admin/users/:id/edit" element={<AdminUsersForm />} />
      </Routes>
    </Layout>
  );
}