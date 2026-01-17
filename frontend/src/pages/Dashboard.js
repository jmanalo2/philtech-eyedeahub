import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, Clock, Lightbulb, Award, Wrench, Star } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Eye-deas',
      value: stats?.total_ideas || 0,
      icon: Lightbulb,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      link: '/ideas'
    },
    {
      title: 'Pending Review',
      value: stats?.pending_ideas || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      link: '/ideas?status=pending'
    },
    {
      title: 'Approved',
      value: stats?.approved_ideas || 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      link: '/ideas?status=approved'
    },
    {
      title: 'Implemented',
      value: stats?.implemented_ideas || 0,
      icon: Award,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      link: '/ideas?status=implemented'
    },
    {
      title: 'Assigned to T&E',
      value: stats?.assigned_to_te_ideas || 0,
      icon: Wrench,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      link: '/ideas?status=assigned_to_te'
    },
    {
      title: 'Revision Requested',
      value: stats?.revision_requested_ideas || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      link: '/ideas?status=revision_requested'
    },
    {
      title: 'Declined',
      value: stats?.declined_ideas || 0,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      link: '/ideas?status=declined'
    },
    {
      title: 'My Submissions',
      value: stats?.my_ideas || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      link: '/ideas'
    }
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome back, {user?.username}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Here&apos;s an overview of your Eye-dea management system</p>
      </div>

      {/* Best Eye-dea Banner */}
      {stats?.best_idea && (
        <Link to={`/ideas/${stats.best_idea.id}`}>
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-yellow-500 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <Badge className="bg-yellow-500 text-white text-xs">Best Eye-dea</Badge>
                      <span className="text-xs sm:text-sm text-gray-600">{stats.best_idea.idea_number}</span>
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 mt-1 truncate">{stats.best_idea.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Submitted by {stats.best_idea.submitted_by_username} • {stats.best_idea.pillar}</p>
                  </div>
                </div>
                <div className="text-right hidden md:block flex-shrink-0">
                  <p className="text-sm text-gray-500">Click to view details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full" data-testid={`stat-card-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Get started with managing your Eye-deas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
            <a
              href="/ideas/new"
              data-testid="quick-action-new-idea"
              className="p-4 sm:p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-colors duration-200 cursor-pointer"
            >
              <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Submit New Eye-dea</h3>
              <p className="text-xs sm:text-sm text-gray-600">Share your innovative ideas</p>
            </a>
            <a
              href="/ideas"
              data-testid="quick-action-view-ideas"
              className="p-4 sm:p-6 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors duration-200 cursor-pointer"
            >
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">View All Eye-deas</h3>
              <p className="text-xs sm:text-sm text-gray-600">Browse submitted ideas</p>
            </a>
            {(user?.role === 'approver' || user?.role === 'admin') && (
              <a
                href="/ideas?status=pending"
                data-testid="quick-action-pending"
                className="p-4 sm:p-6 bg-yellow-50 hover:bg-yellow-100 rounded-lg border-2 border-yellow-200 transition-colors duration-200 cursor-pointer"
              >
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mb-2 sm:mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Review Pending</h3>
                <p className="text-xs sm:text-sm text-gray-600">Eye-deas awaiting approval</p>
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}