
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
}

export function MicronutrientRadarChart({ data }: MicronutrientRadarChartProps) {
  const micronutrients: MicronutrientData[] = [
    { name: "Vitamin A", ...data.vitamin_a, color: "#f97316" }, // orange
    { name: "Vitamin C", ...data.vitamin_c, color: "#84cc16" }, // lime
    { name: "Calcium", ...data.calcium, color: "#06b6d4" },    // cyan
    { name: "Iron", ...data.iron, color: "#a855f7" },         // purple
    { name: "Potassium", ...data.potassium, color: "#ec4899" }, // pink
    { name: "Sodium", ...data.sodium, color: "#64748b" }      // slate
  ];

  const hasNoData = micronutrients.every(nutrient => nutrient.value === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Micronutrients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoData ? (
          <div className="text-center py-4 text-muted-foreground">
            No micronutrient data available
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
  );
}
