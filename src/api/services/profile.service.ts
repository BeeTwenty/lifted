
import { api } from "../config";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const profileService = {
  async getProfile() {
    const { data: { user } } = await api.supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await api.supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(profile: Partial<Profile>) {
    const { data: { user } } = await api.supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await api.supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubscriptionStatus(status: "basic" | "pro") {
    return this.updateProfile({ status });
  },
  
  async checkSubscriptionStatus() {
    const profile = await this.getProfile();
    return profile?.status || "basic";
  },
  
  async isProSubscriber() {
    const status = await this.checkSubscriptionStatus();
    return status === "pro";
  },

  async getSubscriptionInfo() {
    const { data: { session } } = await api.supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    try {
      const response = await fetch(`${api.baseUrl}/functions/v1/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: "subscription-info"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get subscription info: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting subscription info:", error);
      // Return default values if there's an error
      return { 
        prices: {
          pro: { amount: 799, currency: 'usd', interval: 'month' }
        }
      };
    }
  }
};
