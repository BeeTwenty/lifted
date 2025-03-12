
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
import { Trash2, Lock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export const WeightTracker = () => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [newWeight, setNewWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setIsPro(data?.status === "pro");
      
      // Only fetch weight records if user is pro
      if (data?.status === "pro") {
        fetchWeightRecords();
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error checking pro status:", error.message);
      setLoading(false);
    }
  };

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
      
      if (data && data.length > 0) {
        const latestRecord = data[data.length - 1];
        setNewWeight(latestRecord.weight.toString());
        
        if (height) {
          calculateBMI(latestRecord.weight, parseFloat(height));
        }
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
        
        if (weightRecords.length > 0) {
          const latestWeight = weightRecords[weightRecords.length - 1].weight;
          calculateBMI(latestWeight, data.height);
        } else if (newWeight) {
          calculateBMI(parseFloat(newWeight), data.height);
        }
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    setBmi(parseFloat(bmiValue.toFixed(1)));
  };

  const handleAddWeight = async () => {
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Feature",
        description: "Weight tracking is a Pro feature. Please upgrade to continue.",
      });
      return;
    }

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

      const { error: recordError } = await supabase
        .from("weight_records")
        .insert({
          user_id: user.id,
          weight,
          date: today,
        });

      if (recordError) throw recordError;
      
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

  const handleDeleteWeight = async (id: string) => {
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Feature",
        description: "Weight tracking is a Pro feature. Please upgrade to continue.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("weight_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Weight record deleted",
        description: "The weight record has been successfully deleted.",
      });

      fetchWeightRecords();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting weight record",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (weightRecords.length > 0 && height) {
      const latestWeight = weightRecords[weightRecords.length - 1].weight;
      calculateBMI(latestWeight, parseFloat(height));
    }
  }, [weightRecords, height]);

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBmiCategoryColor = (bmi: number) => {
    if (bmi < 18.5) return "#3b82f6";
    if (bmi < 25) return "#10b981";
    if (bmi < 30) return "#f59e0b";
    return "#ef4444";
  };

  const chartData = weightRecords.map(record => ({
    date: record.date,
    weight: record.weight,
  }));

  const getBmiThresholdWeight = (bmiThreshold: number): number | null => {
    if (!height) return null;
    const heightInMeters = parseFloat(height) / 100;
    return parseFloat((bmiThreshold * heightInMeters * heightInMeters).toFixed(1));
  };

  const underweightThreshold = getBmiThresholdWeight(18.5);
  const overweightThreshold = getBmiThresholdWeight(25);

  const latestWeight = weightRecords.length > 0 ? 
    weightRecords[weightRecords.length - 1].weight : 
    (newWeight ? parseFloat(newWeight) : null);

  useEffect(() => {
    if (latestWeight && height) {
      calculateBMI(latestWeight, parseFloat(height));
    }
  }, [latestWeight, height]);

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Pro Feature</h3>
            <p className="mb-4 text-muted-foreground">
              Weight tracking is available exclusively for Pro subscribers.
              Upgrade to Pro to track your weight, calculate BMI, and visualize your progress over time.
            </p>
            <Button asChild>
              <Link to="/?tab=subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

            {(height && latestWeight) && (
              <div className="mt-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800">
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
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...weightRecords].reverse().map((record) => (
                    <tr key={record.id} className="border-t">
                      <td className="py-2">{format(parseISO(record.date), 'PP')}</td>
                      <td className="py-2">{record.weight} kg</td>
                      <td className="py-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteWeight(record.id)}
                          title="Delete weight record"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
