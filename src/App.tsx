import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Micronutrients from "@/pages/Micronutrients";
import Recipes from "@/pages/Recipes";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import { NotificationsProvider } from "./contexts/NotificationsContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Auth />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/micronutrients",
    element: <Micronutrients />,
  },
  {
    path: "/recipes",
    element: <Recipes />,
  },
   {
    path: "/goals",
    element: <Goals />,
  },
  {
    path: "/settings",
    element: <Settings />,
  }
]);

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <NotificationsProvider>
          <RouterProvider router={router} />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
