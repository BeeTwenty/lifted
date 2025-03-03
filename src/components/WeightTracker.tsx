import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, subMonths } from "date-fns";
import { WeightRecord } from "@/types/workout";

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
        .select("height")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data && data.height) {
        setHeight(data.height.toString());
        
        // Calculate BMI if both height and weight are available
        if (newWeight) {
          calculateBMI(parseFloat(newWeight), data.height);
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

      // No need to update profile's weight as it's not in the schema
      
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

  // Calculate BMI threshold weights for the current height
  const getBmiThresholdWeight = (bmiThreshold: number): number | null => {
    if (!height) return null;
    const heightInMeters = parseFloat(height) / 100;
    return parseFloat((bmiThreshold * heightInMeters * heightInMeters).toFixed(1));
  };

  const underweightThreshold = getBmiThresholdWeight(18.5);
  const overweightThreshold = getBmiThresholdWeight(25);

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
                <div className="grid grid-cols-1 gap-4">
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
                    <p className="text-sm text-muted-foreground">
                      Your height can be updated in the settings page
                    </p>
                  </div>
                </div>

                {(height && newWeight) && (
                  <div className="mt-4 p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Your BMI</h3>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold" style={{ color: bmi ? getBmiCategoryColor(bmi) : "inherit" }}>
                            {bmi?.toFixed(1) || "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground">kg/m²</span>
                        </div>
                        {bmi && (
                          <p className="text-sm font-medium" style={{ color: getBmiCategoryColor(bmi) }}>
                            {getBmiCategory(bmi)}
                          </p>
                        )}
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
                      
                      {/* Always show BMI threshold lines if height is available */}
                      {height && (
                        <>
                          {underweightThreshold && (
                            <ReferenceLine 
                              y={underweightThreshold} 
                              stroke="#3b82f6" 
                              strokeDasharray="3 3" 
                              label={{ value: "Underweight", position: "insideTopLeft", fill: "#3b82f6" }} 
                            />
                          )}
                          {overweightThreshold && (
                            <ReferenceLine 
                              y={overweightThreshold} 
                              stroke="#f59e0b" 
                              strokeDasharray="3 3" 
                              label={{ value: "Overweight", position: "insideTopLeft", fill: "#f59e0b" }} 
                            />
                          )}
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="text-muted-foreground">
                      <p>No weight data recorded yet.</p>
                      <p className="text-sm">Add your weight to see the chart.</p>
                      {height && (
                        <p className="mt-4 text-sm">
                          <span className="block font-medium">BMI Reference:</span>
                          {underweightThreshold && <span className="block text-blue-500">Underweight: Below {underweightThreshold} kg</span>}
                          {underweightThreshold && overweightThreshold && <span className="block text-green-600">Normal: {underweightThreshold}-{overweightThreshold} kg</span>}
                          {overweightThreshold && <span className="block text-amber-500">Overweight: Above {overweightThreshold} kg</span>}
                        </p>
                      )}
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
