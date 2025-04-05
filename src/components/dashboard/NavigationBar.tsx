
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Camera, Settings, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CameraOptionsDialog } from "./CameraOptionsDialog";

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleCameraClick = () => {
    setCameraDialogOpen(true);
  };

  const handleCaptureOption = (option: "calories" | "recipe") => {
    setCameraDialogOpen(false);
    
    if (option === "calories") {
      toast({
        title: "Scanning for Calories",
        description: "Camera access requested for calorie scanning.",
      });
      // Future implementation: Access camera for calorie scanning
    } else if (option === "recipe") {
      toast({
        title: "Creating Recipe",
        description: "Camera access requested for recipe creation.",
      });
      // Future implementation: Access camera for recipe creation
    }
  };

  const handleUploadOption = (option: "calories" | "recipe") => {
    setCameraDialogOpen(false);
    
    if (option === "calories") {
      toast({
        title: "Upload for Calories",
        description: "Please select an image to analyze calories.",
      });
      // Future implementation: File upload for calorie scanning
    } else if (option === "recipe") {
      toast({
        title: "Upload for Recipe",
        description: "Please select an image to create a recipe.",
      });
      // Future implementation: File upload for recipe creation
    }
  };
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-4">
        <div className="flex justify-around items-center">
          <NavItem 
            icon={<Home className={`w-6 h-6 ${isActive('/dashboard') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Home" 
            onClick={() => navigate('/dashboard')} 
            active={isActive('/dashboard')}
          />
          <NavItem 
            icon={<BarChart2 className={`w-6 h-6 ${isActive('/progress') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Progress" 
            onClick={() => navigate('/progress')} 
            active={isActive('/progress')}
          />
          <div className="relative flex flex-col items-center justify-center">
            <button 
              className="bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-5"
              onClick={handleCameraClick}
            >
              <Camera className="w-7 h-7" />
            </button>
          </div>
          <NavItem 
            icon={<BookOpen className={`w-6 h-6 ${isActive('/recipes') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Recipes" 
            onClick={() => navigate('/recipes')} 
            active={isActive('/recipes')}
          />
          <NavItem 
            icon={<Settings className={`w-6 h-6 ${isActive('/settings') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Settings" 
            onClick={() => navigate('/settings')} 
            active={isActive('/settings')}
          />
        </div>
      </div>
      
      <CameraOptionsDialog 
        open={cameraDialogOpen} 
        onOpenChange={setCameraDialogOpen} 
        onSelectOption={handleCaptureOption}
        onSelectUpload={handleUploadOption}
      />
    </>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}

function NavItem({ icon, label, onClick, active }: NavItemProps) {
  return (
    <button 
      className="flex flex-col items-center justify-center w-16" 
      onClick={onClick}
    >
      {icon}
      <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );
}
