
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Camera, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MicronutrientData {
  name: string;
  value: number;
  unit: string;
  percentage: number;
  color: string;
}

interface MicronutrientRadarChartProps {
  data: {
    vitamin_a: { value: number; unit: string; percentage: number };
    vitamin_c: { value: number; unit: string; percentage: number };
    calcium: { value: number; unit: string; percentage: number };
    iron: { value: number; unit: string; percentage: number };
    potassium: { value: number; unit: string; percentage: number };
    sodium: { value: number; unit: string; percentage: number };
  };
  showScanButton?: boolean;
  clickable?: boolean;
  scanDate?: string;
  onClick?: () => void;
}

export function MicronutrientRadarChart({ 
  data, 
  showScanButton = true,
  clickable = false,
  scanDate,
  onClick
}: MicronutrientRadarChartProps) {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Ensure all values are at least 0, not undefined
  const safeData = {
    vitamin_a: { 
      value: data.vitamin_a?.value || 0, 
      unit: data.vitamin_a?.unit || 'mcg', 
      percentage: data.vitamin_a?.percentage || 0 
    },
    vitamin_c: { 
      value: data.vitamin_c?.value || 0, 
      unit: data.vitamin_c?.unit || 'mg', 
      percentage: data.vitamin_c?.percentage || 0 
    },
    calcium: { 
      value: data.calcium?.value || 0, 
      unit: data.calcium?.unit || 'mg', 
      percentage: data.calcium?.percentage || 0 
    },
    iron: { 
      value: data.iron?.value || 0, 
      unit: data.iron?.unit || 'mg', 
      percentage: data.iron?.percentage || 0 
    },
    potassium: { 
      value: data.potassium?.value || 0, 
      unit: data.potassium?.unit || 'mg', 
      percentage: data.potassium?.percentage || 0 
    },
    sodium: { 
      value: data.sodium?.value || 0, 
      unit: data.sodium?.unit || 'mg', 
      percentage: data.sodium?.percentage || 0 
    },
  };

  const micronutrients: MicronutrientData[] = [
    { name: "Vitamin A", ...safeData.vitamin_a, color: "#f97316" }, // orange
    { name: "Vitamin C", ...safeData.vitamin_c, color: "#84cc16" }, // lime
    { name: "Calcium", ...safeData.calcium, color: "#06b6d4" },    // cyan
    { name: "Iron", ...safeData.iron, color: "#a855f7" },         // purple
    { name: "Potassium", ...safeData.potassium, color: "#ec4899" }, // pink
    { name: "Sodium", ...safeData.sodium, color: "#64748b" }      // slate
  ];

  const hasNoData = micronutrients.every(nutrient => nutrient.value === 0);
  
  const handleScanButtonClick = () => {
    navigate("/recipes");
  };

  const handleCardClick = () => {
    if (clickable && onClick) {
      onClick();
    } else if (clickable) {
      setDetailsOpen(true);
    }
  };

  const cardProps = clickable ? { 
    onClick: handleCardClick,
    className: "cursor-pointer transition-shadow hover:shadow-md"
  } : {};

  return (
    <>
      <Card {...cardProps}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Micronutrients</span>
            {clickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CardTitle>
          {scanDate && (
            <div className="text-xs text-muted-foreground mt-1">
              {scanDate}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {hasNoData ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-muted-foreground">
                No micronutrient data available
              </div>
              {showScanButton && (
                <Button 
                  onClick={handleScanButtonClick} 
                  className="flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                </Button>
              )}
            </div>
          ) : (
            micronutrients.map((nutrient) => (
              <div key={nutrient.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{nutrient.name}</span>
                  <span>
                    {nutrient.value}{nutrient.unit} ({nutrient.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={nutrient.percentage} 
                  className="h-2"
                  indicatorStyle={{ backgroundColor: nutrient.color }}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Detailed view dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Micronutrient Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {scanDate && (
              <div className="text-sm font-medium">
                Scan date: {scanDate}
              </div>
            )}
            {micronutrients.map((nutrient) => (
              <div key={nutrient.name} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{nutrient.name}</span>
                  <span>
                    {nutrient.value}{nutrient.unit} ({nutrient.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={nutrient.percentage} 
                  className="h-3"
                  indicatorStyle={{ backgroundColor: nutrient.color }}
                />
                <div className="text-xs text-muted-foreground">
                  Daily recommended value: {getRecommendedValue(nutrient.name)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to get recommended daily values
function getRecommendedValue(nutrient: string): string {
  switch (nutrient) {
    case "Vitamin A":
      return "900 mcg";
    case "Vitamin C":
      return "90 mg";
    case "Calcium":
      return "1000 mg";
    case "Iron":
      return "18 mg";
    case "Potassium":
      return "3500 mg";
    case "Sodium":
      return "2300 mg";
    default:
      return "";
  }
}
