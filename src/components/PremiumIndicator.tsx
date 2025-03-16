
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Crown, Star } from "lucide-react";
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
      <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 flex items-center gap-1.5 py-1.5 px-4 shadow-md border border-purple-400">
        <Crown className="h-4 w-4 text-yellow-300" />
        <span className="font-medium">Premium Access</span>
        <Star className="h-3.5 w-3.5 text-yellow-300 ml-0.5" />
      </Badge>
    </motion.div>
  );
}

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <Badge className={`bg-purple-600 hover:bg-purple-700 flex items-center gap-1 py-1 px-2 ${className}`}>
      <Crown className="h-3 w-3 text-yellow-200" />
      <span>Premium</span>
    </Badge>
  );
}
