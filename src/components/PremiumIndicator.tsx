
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { motion } from "framer-motion";

export function PremiumIndicator() {
  const { user, hasActiveSubscription } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user && hasActiveSubscription) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user, hasActiveSubscription]);

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 mt-4"
    >
      <Badge className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1 py-1 px-3 shadow-md">
        <Crown className="h-3.5 w-3.5" />
        <span>Premium Access Enabled</span>
      </Badge>
    </motion.div>
  );
}
