
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday } from "date-fns";

interface NotificationCardProps {
  message?: string;
  showViewAll?: boolean;
  maxItems?: number;
}

export function NotificationCard({ 
  message, 
  showViewAll = true, 
  maxItems = 3 
}: NotificationCardProps) {
  const { notifications, markAsRead } = useNotifications();
  
  // Show all notifications up to maxItems, not just unread ones
  const displayNotifications = notifications.slice(0, maxItems);
    
  // If no notifications but a message was provided, show that
  const displayMessage = displayNotifications.length > 0 
    ? null
    : (message || "No notifications");
    
  const formatNotificationTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d');
      }
    } catch (e) {
      return '';
    }
  };

  return (
    <Card className="bg-accent border-primary/10">
      <CardContent className="p-4">
        {displayMessage ? (
          <div className="flex items-center p-2">
            <AlertCircle className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm">{displayMessage}</span>
          </div>
        ) : (
          <ScrollArea className={displayNotifications.length > 1 ? "h-[120px]" : "h-auto"}>
            <div className="space-y-2">
              {displayNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex items-center justify-between bg-background rounded-md p-2 cursor-pointer hover:bg-accent/50 ${!notification.isRead ? 'border-l-2 border-primary' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    {notification.time && (
                      <span className="text-xs text-muted-foreground block mt-1">
                        Due: {notification.time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {showViewAll && notifications.length > maxItems && (
          <Button 
            variant="ghost"
            className="w-full text-xs mt-2"
            size="sm"
          >
            View All Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
