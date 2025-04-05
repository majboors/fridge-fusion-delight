
import React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="pt-8 px-6 flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate("/settings")}
        className="rounded-full"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}
