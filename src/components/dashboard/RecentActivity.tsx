
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityItem from "./ActivityItem";
import { CapitalFlow } from "@/services/navService";

interface RecentActivityProps {
  activities: CapitalFlow[];
  loading: boolean;
}

const RecentActivity = ({ activities, loading }: RecentActivityProps) => {
  return (
    <Card className="p-6 metric-card">
      <h2 className="text-lg font-semibold mb-4 text-white">Recent Activity</h2>
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full" />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              type={activity.type as 'contribution' | 'withdrawal'}
              amount={activity.amount}
              investor={activity.investor_name}
              date={activity.date}
            />
          ))}
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          No recent activities
        </div>
      )}
    </Card>
  );
};

export default RecentActivity;
