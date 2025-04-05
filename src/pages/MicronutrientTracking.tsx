
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar 
} from "recharts";

interface MicronutrientHistory {
  date: string;
  vitamin_a: number;
  vitamin_c: number;
  calcium: number;
  iron: number;
  potassium: number;
  sodium: number;
}

interface MicronutrientAverages {
  vitamin_a: { value: number; unit: string; percentage: number };
  vitamin_c: { value: number; unit: string; percentage: number };
  calcium: { value: number; unit: string; percentage: number };
  iron: { value: number; unit: string; percentage: number };
  potassium: { value: number; unit: string; percentage: number };
  sodium: { value: number; unit: string; percentage: number };
}

export default function MicronutrientTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<MicronutrientHistory[]>([]);
  const [averages, setAverages] = useState<MicronutrientAverages>({
    vitamin_a: { value: 0, unit: "mcg", percentage: 0 },
    vitamin_c: { value: 0, unit: "mg", percentage: 0 },
    calcium: { value: 0, unit: "mg", percentage: 0 },
    iron: { value: 0, unit: "mg", percentage: 0 },
    potassium: { value: 0, unit: "mg", percentage: 0 },
    sodium: { value: 0, unit: "mg", percentage: 0 },
  });

  const [radarData, setRadarData] = useState<{ name: string; value: number; fullMark: number }[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchMicronutrientData();
  }, [user, navigate]);

  const fetchMicronutrientData = async () => {
    try {
      setLoading(true);

      const mockHistoryData: MicronutrientHistory[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        mockHistoryData.push({
          date: date.toISOString().split('T')[0],
          vitamin_a: Math.floor(Math.random() * 800) + 200,
          vitamin_c: Math.floor(Math.random() * 80) + 20,
          calcium: Math.floor(Math.random() * 800) + 200,
          iron: Math.floor(Math.random() * 14) + 4,
          potassium: Math.floor(Math.random() * 3000) + 1000,
          sodium: Math.floor(Math.random() * 2000) + 500,
        });
      }
      
      setHistoryData(mockHistoryData);
      
      const avgValues = {
        vitamin_a: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.vitamin_a, 0) / mockHistoryData.length),
          unit: "mcg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.vitamin_a, 0) / mockHistoryData.length) / 900 * 100)
        },
        vitamin_c: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.vitamin_c, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.vitamin_c, 0) / mockHistoryData.length) / 90 * 100)
        },
        calcium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.calcium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.calcium, 0) / mockHistoryData.length) / 1000 * 100)
        },
        iron: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.iron, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.iron, 0) / mockHistoryData.length) / 18 * 100)
        },
        potassium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.potassium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.potassium, 0) / mockHistoryData.length) / 3500 * 100)
        },
        sodium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.sodium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.sodium, 0) / mockHistoryData.length) / 2300 * 100)
        }
      };
      
      setAverages(avgValues);
      
      setRadarData([
        { name: "Vitamin A", value: avgValues.vitamin_a.percentage, fullMark: 100 },
        { name: "Vitamin C", value: avgValues.vitamin_c.percentage, fullMark: 100 },
        { name: "Calcium", value: avgValues.calcium.percentage, fullMark: 100 },
        { name: "Iron", value: avgValues.iron.percentage, fullMark: 100 },
        { name: "Potassium", value: avgValues.potassium.percentage, fullMark: 100 },
        { name: "Sodium", value: avgValues.sodium.percentage, fullMark: 100 },
      ]);
      
    } catch (error) {
      console.error("Error fetching micronutrient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <PageHeader title="Micronutrient Tracking" />

      <div className="px-6 py-6 space-y-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Micronutrient Balance <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>7-day average of your micronutrient intake</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full h-[300px]">
              <ChartContainer 
                config={{
                  vitamin_a: { color: "#f97316" },
                  vitamin_c: { color: "#84cc16" },
                  calcium: { color: "#06b6d4" },
                  iron: { color: "#a855f7" },
                  potassium: { color: "#ec4899" },
                  sodium: { color: "#64748b" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <Radar
                      name="Micronutrients"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <MicronutrientRadarChart data={averages} />

        <Card>
          <CardHeader>
            <CardTitle>7-Day History</CardTitle>
            <CardDescription>Your daily micronutrient intake for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Vitamin A (mcg)</TableHead>
                    <TableHead>Vitamin C (mg)</TableHead>
                    <TableHead>Calcium (mg)</TableHead>
                    <TableHead>Iron (mg)</TableHead>
                    <TableHead>Potassium (mg)</TableHead>
                    <TableHead>Sodium (mg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.vitamin_a}</TableCell>
                      <TableCell>{day.vitamin_c}</TableCell>
                      <TableCell>{day.calcium}</TableCell>
                      <TableCell>{day.iron}</TableCell>
                      <TableCell>{day.potassium}</TableCell>
                      <TableCell>{day.sodium}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}
