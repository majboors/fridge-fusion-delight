
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MacronutrientData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MacronutrientPieChartProps {
  data: {
    protein: { value: number; percentage: number };
    carbs: { value: number; percentage: number };
    fat: { value: number; percentage: number };
    fiber?: { value: number; percentage: number };
  };
}

export function MacronutrientPieChart({ data }: MacronutrientPieChartProps) {
  const chartData: MacronutrientData[] = [
    { name: "Protein", value: data.protein.value, percentage: data.protein.percentage, color: "#4ade80" },
    { name: "Carbs", value: data.carbs.value, percentage: data.carbs.percentage, color: "#facc15" },
    { name: "Fat", value: data.fat.value, percentage: data.fat.percentage, color: "#60a5fa" }
  ];
  
  if (data.fiber && data.fiber.value > 0) {
    chartData.push({ 
      name: "Fiber", 
      value: data.fiber.value, 
      percentage: data.fiber.percentage, 
      color: "#f59e0b" 
    });
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Macronutrients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value}g`, name]}
                labelFormatter={() => ""} 
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
