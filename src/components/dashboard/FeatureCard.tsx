
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  route?: string;
  routeState?: Record<string, any>;
}

export function FeatureCard({ title, icon: Icon, onClick, route, routeState }: FeatureCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (route) {
      navigate(route, { state: routeState });
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className="flex flex-col items-center justify-center p-5 cursor-pointer transition-all hover:bg-accent hover:shadow-md"
      onClick={handleClick}
    >
      <Icon className="h-8 w-8 text-primary mb-3" />
      <span className="text-sm font-medium text-center">{title}</span>
    </Card>
  );
}
