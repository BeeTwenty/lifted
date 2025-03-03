
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, subMonths } from "date-fns";

interface WeightRecord {
  id: string;
  date: string;
  weight: number;
}

interface ProfileData {
  height: number | null;
  weight: number | null;
}

export const WeightTracker = () => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [newWeight, setNewWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeightRecords();
    fetchUserProfile();
  }, []);

  const fetchWeightRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("weight_records")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      
      setWeightRecords(data || []);
      
      // Set current weight from the latest record
      if (data && data.length > 0) {
        setNewWeight(data[data.length - 1].weight.toString());
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching weight records:", error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("height, weight")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        if (data.height) setHeight(data.height.toString());
        // Calculate BMI if both height and weight are available
        if (data.height && data.weight) {
          calculateBMI(data.weight, data.height);
        }
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    // BMI = weight(kg) / (height(m) * height(m))
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    setBmi(parseFloat(bmiValue.toFixed(1)));
  };

  const handleAddWeight = async () => {
    if (!newWeight) {
      toast({
        variant: "destructive",
        title: "Weight required",
        description: "Please enter your weight.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const weight = parseFloat(newWeight);
      const today = new Date().toISOString().split('T')[0];

      // Add weight record
      const { error: recordError } = await supabase
        .from("weight_records")
        .insert({
          user_id: user.id,
          weight,
          date: today,
        });

      if (recordError) throw recordError;

      // Update profile with latest weight
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ weight })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update BMI if height is available
      if (height) {
        calculateBMI(weight, parseFloat(height));
      }

      toast({
        title: "Weight recorded",
        description: "Your weight has been successfully recorded.",
      });

      fetchWeightRecords();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording weight",
        description: error.message,
      });
    }
  };

  const handleUpdateHeight = async () => {
    if (!height) {
      toast({
        variant: "destructive",
        title: "Height required",
        description: "Please enter your height.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const heightValue = parseFloat(height);

      const { error } = await supabase
        .from("profiles")
        .update({ height: heightValue })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Height updated",
        description: "Your height has been successfully updated.",
      });

      // Update BMI if weight is available
      if (newWeight) {
        calculateBMI(parseFloat(newWeight), heightValue);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating height",
        description: error.message,
      });
    }
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBmiCategoryColor = (bmi: number) => {
    if (bmi < 18.5) return "#3b82f6"; // Blue for underweight
    if (bmi < 25) return "#10b981"; // Green for normal
    if (bmi < 30) return "#f59e0b"; // Orange for overweight
    return "#ef4444"; // Red for obese
  };

  // Prepare data for the chart
  const chartData = weightRecords.map(record => ({
    date: record.date,
    weight: record.weight,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p>Loading your weight data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Current Weight (kg)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="weight"
                        type="number"
                        placeholder="Enter weight in kg"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                      />
                      <Button onClick={handleAddWeight}>Save</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="height"
                        type="number"
                        placeholder="Enter height in cm"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                      <Button onClick={handleUpdateHeight}>Update</Button>
                    </div>
                  </div>
                </div>

                {bmi !== null && (
                  <div className="mt-4 p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Your BMI</h3>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold" style={{ color: getBmiCategoryColor(bmi) }}>{bmi}</span>
                          <span className="text-sm text-muted-foreground">kg/m²</span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: getBmiCategoryColor(bmi) }}>
                          {getBmiCategory(bmi)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>Underweight: &lt;18.5</div>
                        <div>Normal: 18.5-24.9</div>
                        <div>Overweight: 25-29.9</div>
                        <div>Obese: ≥30</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                      />
                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip 
                        labelFormatter={(date) => format(parseISO(date as string), 'MMM d, yyyy')}
                        formatter={(value) => [`${value} kg`, 'Weight']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      {height && bmi && (
                        <>
                          <ReferenceLine 
                            y={(18.5 * (parseFloat(height) / 100) * (parseFloat(height) / 100)).toFixed(1)} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3" 
                            label={{ value: "Underweight", position: "insideTopLeft", fill: "#3b82f6" }} 
                          />
                          <ReferenceLine 
                            y={(25 * (parseFloat(height) / 100) * (parseFloat(height) / 100)).toFixed(1)} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            label={{ value: "Overweight", position: "insideTopLeft", fill: "#f59e0b" }} 
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="text-muted-foreground">
                      <p>No weight data recorded yet.</p>
                      <p className="text-sm">Add your weight to see the chart.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {weightRecords.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Weight History</h3>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...weightRecords].reverse().map((record) => (
                        <tr key={record.id} className="border-t">
                          <td className="py-2">{format(parseISO(record.date), 'PP')}</td>
                          <td className="py-2">{record.weight} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
