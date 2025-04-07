
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useNotifications } from "@/contexts/NotificationsContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Refresh notifications when opening the panel
      fetchNotifications();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatNotificationTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (e) {
      return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "goal": return "Goal Reminder";
      case "meal": return "Meal Log";
      default: return "System";
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 ${notification.isRead ? 'bg-background' : 'bg-accent/50'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {getTypeLabel(notification.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{notification.message}</p>
                  {notification.time && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Due: {notification.time}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs justify-center"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
