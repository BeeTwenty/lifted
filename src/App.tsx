
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Nutrition from "@/pages/Nutrition";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/components/AuthProvider";
import { hideSplashScreen } from "vite-plugin-splash-screen/runtime";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useDevicePlatform } from "@/hooks/use-mobile";
import { useEffect } from "react";

// Create a client
const queryClient = new QueryClient();

// App download links
const APP_LINKS = {
  ANDROID_APK: "https://sftp.au11no.com/web/client/pubshares/8XQdykeNWeoERbFx4EPeu/download?compress=false",
  WEB_APP: "https://workoutapp.au11no.com"
};

// Mobile app suggestion component
const AppSuggestion = () => {
  const { toast } = useToast();
  const { isAndroid, isMobile } = useDevicePlatform();
  
  useEffect(() => {
    if (isMobile) {
      if (isAndroid) {
        toast({
          title: "Android App Available!",
          description: (
            <div className="flex flex-col gap-2 dark:text-gray-300">
              <p>Get a better experience with our Android app</p>
              <a 
                href={APP_LINKS.ANDROID_APK} 
                className="bg-primary text-white dark:text-black px-4 py-2 rounded text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download APK
              </a>
            </div>
          ),
          duration: 10000,
        });
      } else {
        toast({
          title: "Mobile Web Version Available!",
          description: (
            <div className="flex flex-col gap-2 dark:text-gray-300">
              <p>Try our optimized mobile web version</p>
              <a 
                href={APP_LINKS.WEB_APP} 
                className="bg-primary text-white dark:text-black  px-4 py-2 rounded text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Mobile Web
              </a>
            </div>
          ),
          duration: 10000,
        });
      }
    }
  }, [isMobile, isAndroid, toast]);
  
  return null;
};

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
            <AppSuggestion />
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
