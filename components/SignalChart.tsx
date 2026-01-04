import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FrequencyData } from '../types';

interface SignalChartProps {
  data: FrequencyData[];
}

const SignalChart: React.FC<SignalChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Problem Frequency & Intensity</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 10]} hide />
            <YAxis 
              dataKey="problem" 
              type="category" 
              width={150} 
              tick={{ fontSize: 11, fill: '#475569' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f1f5f9'}}
            />
            <Bar dataKey="frequency" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.frequency > 7 ? '#ef4444' : entry.frequency > 4 ? '#f59e0b' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center">
        <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-1"></div>High Frequency</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 rounded mr-1"></div>Medium Frequency</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>Low Frequency</div>
      </div>
    </div>
  );
};

export default SignalChart;
