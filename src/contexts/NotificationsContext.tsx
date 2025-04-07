
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  message: string;
  time?: string;
  type: "goal" | "meal" | "system";
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "isRead" | "createdAt">) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications from local storage initially and then from Supabase
  useEffect(() => {
    const loadLocalNotifications = () => {
      const savedNotifications = localStorage.getItem('userNotifications');
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (e) {
          console.error("Error loading notifications from local storage", e);
          localStorage.removeItem('userNotifications');
        }
      }
    };

    loadLocalNotifications();
    
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('userNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Fetch goals with upcoming deadlines
      const { data: goalData, error: goalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalError) {
        console.error('Error fetching goals:', goalError);
        return;
      }

      // Generate notifications based on goals
      const goalNotifications: Notification[] = [];
      
      // This is a placeholder - in a real app, you would generate these based on actual goal data
      if (goalData && goalData.length > 0) {
        // Add a generic notification if goals exist
        goalNotifications.push({
          id: `goal-reminder-${Date.now()}`,
          message: "Don't forget to log your meals to track your progress!",
          type: "goal",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      // Combine with existing notifications, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = goalNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...newNotifications];
      });
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, "id" | "isRead" | "createdAt">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for new notification
    toast({
      title: "New Notification",
      description: notification.message,
    });
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    fetchNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
