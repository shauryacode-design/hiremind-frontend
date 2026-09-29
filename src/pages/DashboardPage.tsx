import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { DashboardSummary } from '../types';
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Award,
  Plus,
  Calendar,
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardApi.getDashboard();
      setSummary(response.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  const hasInterviews = summary && summary.total_interviews > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your interview progress.</p>
        </div>
        {!hasInterviews && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Start Interview
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Interviews"
          value={summary?.total_interviews || 0}
          icon={MessageSquare}
          color="blue"
        />
        <MetricCard
          title="Completed"
          value={summary?.completed_interviews || 0}
          icon={LayoutDashboard}
          color="green"
        />
        <MetricCard
          title="Average Score"
          value={summary?.average_score || 0}
          icon={TrendingUp}
          color="purple"
          suffix="/100"
        />
        <MetricCard
          title="Best Score"
          value={summary?.best_score || '--'}
          icon={Award}
          color="amber"
          suffix={summary?.best_score ? '/100' : ''}
        />
      </div>

      {/* Empty State */}
      {!hasInterviews && (
        <EmptyState
          icon={MessageSquare}
          title="No interviews yet"
          description="Start your first AI-powered interview to track your progress and improve your skills."
          actionText="Start your first interview"
          onAction={() => navigate('/interviews/setup')}
        />
      )}

      {/* Recent Activity (placeholder for now) */}
      {hasInterviews && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Software Engineer Interview</p>
                  <p className="text-sm text-slate-600">Completed • Score: 85/100</p>
                </div>
                <span className="text-sm text-slate-500">2 days ago</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'amber';
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, suffix = '' }) => {
  const colorClasses = {
    blue: 'bg-primary-100 text-primary-700',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-primary-100 text-primary-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix}
      </div>
      <div className="text-sm text-slate-600">{title}</div>
    </div>
  );
};

export default DashboardPage;