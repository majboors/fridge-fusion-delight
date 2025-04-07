
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  
  // Helper to check if a notification was already sent today
  const hasNotificationByTypeToday = (type: string) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return notifications.some(n => 
      n.type === type && 
      new Date(n.createdAt).toISOString().split('T')[0] === today
    );
  };

  // Helper to check if a specific notification ID already exists
  const hasNotificationWithId = (id: string) => {
    return notifications.some(n => n.id === id);
  };

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

  // Generate time-based notifications
  useEffect(() => {
    if (!user) return;
    
    const generateTimeBasedNotifications = async () => {
      const hour = new Date().getHours();
      let mealType = "";
      let mealTime = "";
      let actionMessage = "";
      
      // Determine meal type based on time of day
      if (hour >= 5 && hour < 10) {
        mealType = "breakfast";
        mealTime = "8:00 AM";
        actionMessage = "Log your breakfast";
      } else if (hour >= 11 && hour < 14) {
        mealType = "lunch";
        mealTime = "12:00 PM";
        actionMessage = "Log your lunch";
      } else if (hour >= 17 && hour < 21) {
        mealType = "dinner";
        mealTime = "7:00 PM";
        actionMessage = "Log your dinner";
      }
      
      // Only add notification if a mealType was determined
      if (mealType) {
        const notifId = `meal-reminder-${mealType}-${new Date().toISOString().split('T')[0]}`;
        
        // Check if this specific notification already exists
        if (!hasNotificationWithId(notifId)) {
          const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
          
          // First check if user has a meal plan
          const { data: mealPlans, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error) {
            console.error('Error checking meal plans:', error);
            // Default notification if error or no meal plan
            addNotification({
              id: notifId,
              message: `Don't forget to ${actionMessage.toLowerCase()}!`,
              type: "meal",
              time: mealTime
            });
            return;
          }
          
          // Generate notification based on meal plan if it exists
          if (mealPlans && mealPlans.length > 0 && mealPlans[0].meals) {
            // Find the specific meal from the meal plan
            try {
              const meals = mealPlans[0].meals as any[];
              let relevantMeal = null;
              
              if (Array.isArray(meals)) {
                // Find meal based on type
                relevantMeal = meals.find(m => 
                  typeof m === 'object' && 
                  m !== null && 
                  'name' in m && 
                  typeof m.name === 'string' && 
                  m.name.toLowerCase().includes(mealType)
                );
                
                if (relevantMeal && 'foods' in relevantMeal && Array.isArray(relevantMeal.foods)) {
                  addNotification({
                    id: notifId,
                    message: `${capitalizedMealType} time: Save your ${mealType} - ${relevantMeal.foods.join(', ')}`,
                    type: "meal",
                    time: relevantMeal.time || mealTime
                  });
                } else {
                  // Fallback if no matching meal found
                  addNotification({
                    id: notifId,
                    message: `Don't forget to ${actionMessage.toLowerCase()}!`,
                    type: "meal",
                    time: mealTime
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing meal plan:', e);
              // Fallback notification
              addNotification({
                id: notifId,
                message: `Don't forget to ${actionMessage.toLowerCase()}!`,
                type: "meal",
                time: mealTime
              });
            }
          } else {
            // No meal plan found - send default notification
            addNotification({
              id: notifId,
              message: `Don't forget to ${actionMessage.toLowerCase()}!`,
              type: "meal",
              time: mealTime
            });
          }
        }
      }
      
      // Check for meal plan once per day
      if (!hasNotificationByTypeToday("goal")) {
        try {
          // Check if user has a meal plan
          const { data: mealPlans, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) throw error;
          
          if (!mealPlans || mealPlans.length === 0) {
            // No meal plan, remind user to create one
            addNotification({
              message: "Create a meal plan to track your nutrition goals better!",
              type: "goal"
            });
          } else {
            // User has a meal plan, check their goal progress
            const { data: nutritionData, error: nutritionError } = await supabase
              .from('nutrition_data')
              .select('*')
              .eq('user_id', user.id)
              .eq('date', new Date().toISOString().split('T')[0])
              .maybeSingle();
              
            if (nutritionError) {
              console.error('Error fetching nutrition data:', nutritionError);
              return;
            }
            
            if (nutritionData) {
              // Calculate how far they are from their protein goal
              const proteinPercentage = Math.round((nutritionData.protein_consumed / nutritionData.protein_goal) * 100);
              
              if (proteinPercentage < 80) {
                const remaining = 100 - proteinPercentage;
                addNotification({
                  message: `You're ${remaining}% away from your protein goal today`,
                  type: "goal"
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking meal plans:', error);
        }
      }
    };
    
    // Run immediately
    generateTimeBasedNotifications();
    
    // Set up interval to periodically check for time-based notifications
    const intervalId = setInterval(generateTimeBasedNotifications, 1000 * 60 * 30); // Check every 30 minutes
    
    return () => clearInterval(intervalId);
  }, [user, notifications]);

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

      // Generate notifications based on goals, but only if we haven't already today
      if (goalData && goalData.length > 0 && !hasNotificationByTypeToday("goal")) {
        const goalNotification: Notification = {
          id: `goal-reminder-${new Date().toISOString().split('T')[0]}`,
          message: "Track your food today to meet your nutrition goals!",
          type: "goal",
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Add to notifications without duplicating
        setNotifications(prev => {
          if (prev.some(n => n.id === goalNotification.id)) return prev;
          return [...prev, goalNotification];
        });
      }
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

  const addNotification = (notification: Omit<Notification, "id" | "isRead" | "createdAt"> & { id?: string }) => {
    const newNotification: Notification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Check for duplicates before adding
    setNotifications(prev => {
      // If notification with this ID already exists, don't add it
      if (prev.some(n => n.id === newNotification.id)) {
        return prev;
      }
      
      // If this is a meal or goal notification, check if we already have one for today
      if ((newNotification.type === "meal" || newNotification.type === "goal") && 
          !notification.id) { // Skip check for notifications with explicit IDs
        const todayDate = new Date().toISOString().split('T')[0];
        const hasSimilarNotification = prev.some(n => 
          n.type === newNotification.type && 
          n.message === newNotification.message &&
          new Date(n.createdAt).toISOString().split('T')[0] === todayDate
        );
        
        if (hasSimilarNotification) {
          return prev;
        }
      }
      
      // Show toast for new notification
      toast({
        title: "New Notification",
        description: newNotification.message,
      });
      
      return [newNotification, ...prev];
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
