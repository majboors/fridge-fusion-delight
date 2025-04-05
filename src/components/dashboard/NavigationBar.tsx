
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Camera, Settings } from "lucide-react";

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
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
          onClick={() => navigate('/dashboard')} 
          active={isActive('/progress')}
        />
        <div className="relative flex flex-col items-center justify-center">
          <button 
            className="bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-5"
            onClick={() => {}}
          >
            <Camera className="w-7 h-7" />
          </button>
        </div>
        <NavItem 
          icon={<BarChart2 className={`w-6 h-6 ${isActive('/recipes') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
          label="Recipes" 
          onClick={() => navigate('/dashboard')} 
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
