import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, Clock, Lightbulb, Award, Wrench, Star, Filter, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    pillar: '',
    department: '',
    team: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchFilterData = async () => {
    try {
      const [pillarsRes, deptsRes, teamsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/pillars`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/departments`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/teams`)
      ]);
      setPillars(pillarsRes.data);
      setDepartments(deptsRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to fetch filter data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.pillar) params.pillar = filters.pillar;
      if (filters.department) params.department = filters.department;
      if (filters.team) params.team = filters.team;
      
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/stats`, { params });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const actualValue = value === ' ' ? '' : value;
    const newFilters = { ...filters, [key]: actualValue };
    
    // Reset dependent filters
    if (key === 'pillar') {
      newFilters.department = '';
      newFilters.team = '';
    } else if (key === 'department') {
      newFilters.team = '';
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({ pillar: '', department: '', team: '' });
  };

  const hasActiveFilters = filters.pillar || filters.department || filters.team;

  const filteredDepartments = filters.pillar 
    ? departments.filter(d => d.pillar === filters.pillar)
    : departments;

  const filteredTeams = filters.department
    ? teams.filter(t => t.department === filters.department)
    : filters.pillar
    ? teams.filter(t => t.pillar === filters.pillar)
    : teams;

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome back, {user?.username}!</h1>
            <p className="text-sm sm:text-base text-gray-600">Here&apos;s an overview of your Eye-dea management system</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5">Active</Badge>}
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6" data-testid="dashboard-filters">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Pillar</label>
                <Select value={filters.pillar} onValueChange={(v) => handleFilterChange('pillar', v)}>
                  <SelectTrigger data-testid="filter-pillar" className="text-sm">
                    <SelectValue placeholder="All Pillars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Pillars</SelectItem>
                    {pillars.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Department</label>
                <Select value={filters.department} onValueChange={(v) => handleFilterChange('department', v)} disabled={!filters.pillar}>
                  <SelectTrigger data-testid="filter-department" className="text-sm">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Departments</SelectItem>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Team</label>
                <Select value={filters.team} onValueChange={(v) => handleFilterChange('team', v)} disabled={!filters.department}>
                  <SelectTrigger data-testid="filter-team" className="text-sm">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Teams</SelectItem>
                    {filteredTeams.map((t) => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500" data-testid="clear-filters-btn">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.pillar && <Badge variant="secondary">{filters.pillar}</Badge>}
                {filters.department && <Badge variant="secondary">{filters.department}</Badge>}
                {filters.team && <Badge variant="secondary">{filters.team}</Badge>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Best Eye-dea Banner - REMOVED FROM HERE, MOVED TO BOTTOM */}

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