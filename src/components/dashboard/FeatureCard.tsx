
import React from 'react';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export function FeatureCard({ title, icon: Icon, onClick }: FeatureCardProps) {
  return (
    <Card 
      className="flex flex-col items-center justify-center p-5 cursor-pointer transition-all hover:bg-accent hover:shadow-md"
      onClick={onClick}
    >
      <Icon className="h-8 w-8 text-primary mb-3" />
      <span className="text-sm font-medium text-center">{title}</span>
    </Card>
  );
}
