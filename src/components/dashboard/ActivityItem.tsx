
import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ActivityItemProps { 
  type: 'contribution' | 'withdrawal'; 
  amount: number; 
  investor: string; 
  date: string;
}

const ActivityItem = ({ 
  type, 
  amount, 
  investor, 
  date 
}: ActivityItemProps) => {
  const isContribution = type === 'contribution';
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg activity-item">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${
          isContribution ? 'bg-success-DEFAULT/20' : 'bg-danger-DEFAULT/20'
        }`}>
          {isContribution ? (
            <ArrowUp className={`w-4 h-4 text-success-DEFAULT`} />
          ) : (
            <ArrowDown className={`w-4 h-4 text-danger-DEFAULT`} />
          )}
        </div>
        <div>
          <p className="font-medium text-white">{investor}</p>
          <p className="text-sm text-gray-400">
            {new Date(date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${
          isContribution ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
        }`}>
          {isContribution ? '+' : '-'}${(amount / 1000).toFixed(1)}k
        </p>
        <p className="text-sm text-gray-400">{type}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
