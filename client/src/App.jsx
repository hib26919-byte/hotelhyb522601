import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Footer from "./components/Footer";
import FestivalBanner from "./components/FestivalBanner";
import ChatBot from "./components/ChatBot";
import BookingModal from "./components/BookingModal";
import AuthModal from "./components/AuthModal";
import ScrollToTop from "./components/ScrollToTop";
import FloatingContact from "./components/FloatingContact";  // ← NEW
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

const Home = lazy(() => import("./pages/Home"));
const Rooms = lazy(() => import("./pages/Rooms"));
const About = lazy(() => import("./pages/About"));
const Dining = lazy(() => import("./pages/Dining"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminRooms = lazy(() => import("./admin/AdminRooms"));
const AdminBookings = lazy(() => import("./admin/AdminBookings"));
const AdminGallery = lazy(() => import("./admin/AdminGallery"));
const AdminFestival = lazy(() => import("./admin/AdminFestival"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AdminRevenue = lazy(() => import("./admin/AdminRevenue"));
const AdminNotifications = lazy(() => import("./admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./admin/AdminSettings"));

const PageLoader = () => (
  <div className="page-loader">Curating your Bael Tree experience...</div>
);

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Scroll reveal observer — re-runs on every route change
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    const observeElements = () => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => observer.observe(el));
    };

    // Initial check
    observeElements();

    // Observe future elements (e.g., loaded via Suspense or data fetching)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <FestivalBanner />}
      {!isAdminRoute && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/dining" element={<Dining />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="festival" element={<AdminFestival />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileNav />}
      {!isAdminRoute && <ChatBot />}
      {!isAdminRoute && <FloatingContact />}  {/* ← NEW floating call/whatsapp */}

      <BookingModal />
      <AuthModal />
    </>
  );
};

export default App;