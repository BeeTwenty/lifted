
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Nutrition from "@/pages/Nutrition";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/components/AuthProvider";
import { hideSplashScreen } from "vite-plugin-splash-screen/runtime";
import { ThemeProvider } from "@/components/ThemeProvider";

// Create a client
const queryClient = new QueryClient();

// Protected route component for admin access
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // The actual protection logic is inside the Admin component
  // This is just to make the structure clear in the router
  return <>{children}</>;
};

function App() {
  hideSplashScreen();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fitness-theme">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
