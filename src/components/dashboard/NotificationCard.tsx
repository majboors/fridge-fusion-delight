
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface NotificationCardProps {
  message: string;
}

export function NotificationCard({ message }: NotificationCardProps) {
  return (
    <Card className="bg-accent border-primary/10">
      <CardContent className="flex items-center p-4">
        <AlertCircle className="h-5 w-5 text-primary mr-2" />
        <span className="text-sm">{message}</span>
      </CardContent>
    </Card>
  );
}
