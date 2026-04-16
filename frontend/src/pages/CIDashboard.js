import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Zap, Award, TrendingUp, DollarSign, Clock, Download, 
  BarChart3, PieChart as PieChartIcon, Lightbulb, Users, CalendarIcon, CheckCircle, Wrench, Filter, X, Star, Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function CIDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [bestIdeas, setBestIdeas] = useState([]);
  const [filters, setFilters] = useState({
    pillar: '',
    department: '',
    team: ''
  });

  useEffect(() => {
    fetchFilterData();
    fetchBestIdeas();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, filters]);

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

  const fetchBestIdeas = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/ideas/best-ideas`);
      setBestIdeas(response.data);
    } catch (error) {
      console.error('Failed to fetch best ideas:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
      if (filters.pillar) params.pillar = filters.pillar;
      if (filters.department) params.department = filters.department;
      if (filters.team) params.team = filters.team;
      
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/analytics`, { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleFilterChange = (key, value) => {
    const actualValue = value === ' ' ? '' : value;
    const newFilters = { ...filters, [key]: actualValue };
    
    if (key === 'pillar') {
      newFilters.department = '';
      newFilters.team = '';
    } else if (key === 'department') {
      newFilters.team = '';
    }
    
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({ pillar: '', department: '', team: '' });
    setStartDate(null);
    setEndDate(null);
  };

  const hasActiveFilters = filters.pillar || filters.department || filters.team || startDate || endDate;

  const filteredDepartments = filters.pillar 
    ? departments.filter(d => d.pillar === filters.pillar)
    : departments;

  const filteredTeams = filters.department
    ? teams.filter(t => t.department === filters.department)
    : filters.pillar
    ? teams.filter(t => t.pillar === filters.pillar)
    : teams;

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/dashboard/export-excel`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'philtech_eyedeas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Quick Wins',
      value: analytics?.quick_wins_count || 0,
      icon: Zap,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      description: 'Ideas implemented quickly'
    },
    {
      title: 'Implemented',
      value: analytics?.implemented_count || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      description: `Rate: ${analytics?.implementation_rate || 0}%`
    },
    {
      title: 'Assigned to T&E',
      value: analytics?.assigned_to_te_count || 0,
      icon: Wrench,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      description: `Rate: ${analytics?.assigned_to_te_rate || 0}%`
    },
    {
      title: 'High Complexity',
      value: analytics?.complexity_counts?.high || 0,
      icon: Award,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      description: 'Complex implementations'
    }
  ];

  const complexityData = analytics?.charts_data?.complexity_chart || [];
  const statusData = analytics?.charts_data?.status_chart || [];

  return (
    <div data-testid="ci-dashboard-page">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">C.I. Excellence Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Analytics and insights for continuous improvement</p>
        </div>
        <Button
          data-testid="export-excel-btn"
          onClick={handleExportExcel}
          disabled={exporting}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Excel'}
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="mb-6" data-testid="ci-filters">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm text-gray-700">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500 h-6 px-2" data-testid="clear-all-filters">
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Pillar Filter */}
            <Select value={filters.pillar} onValueChange={(v) => handleFilterChange('pillar', v)}>
              <SelectTrigger data-testid="ci-filter-pillar" className="text-sm">
                <SelectValue placeholder="All Pillars" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Pillars</SelectItem>
                {pillars.map((p) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Department Filter */}
            <Select value={filters.department} onValueChange={(v) => handleFilterChange('department', v)} disabled={!filters.pillar}>
              <SelectTrigger data-testid="ci-filter-department" className="text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Departments</SelectItem>
                {filteredDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Team Filter */}
            <Select value={filters.team} onValueChange={(v) => handleFilterChange('team', v)} disabled={!filters.department}>
              <SelectTrigger data-testid="ci-filter-team" className="text-sm">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Teams</SelectItem>
                {filteredTeams.map((t) => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {startDate ? format(startDate, 'MMM d, yyyy') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {endDate ? format(endDate, 'MMM d, yyyy') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
            
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-gray-500">
                Clear Dates
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.pillar && <Badge variant="secondary">{filters.pillar}</Badge>}
              {filters.department && <Badge variant="secondary">{filters.department}</Badge>}
              {filters.team && <Badge variant="secondary">{filters.team}</Badge>}
              {startDate && <Badge variant="secondary">From: {format(startDate, 'MMM d')}</Badge>}
              {endDate && <Badge variant="secondary">To: {format(endDate, 'MMM d')}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow card-hover animate-slide-up" style={{ animationDelay: `${index * 80}ms` }} data-testid={`ci-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-900">Total Cost Savings</CardTitle>
                <CardDescription>Estimated financial impact</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              ${(analytics?.total_cost_savings || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-slide-up" style={{ animationDelay: '420ms' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Total Time Saved</CardTitle>
                <CardDescription>Efficiency improvements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">
              {analytics?.total_time_saved?.hours || 0}h {analytics?.total_time_saved?.minutes || 0}m
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complexity Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <CardTitle>Complexity Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of evaluated ideas by complexity</CardDescription>
          </CardHeader>
          <CardContent>
            {complexityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={complexityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: '11px' }}
                  >
                    {complexityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No complexity data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <CardTitle>Status Distribution</CardTitle>
            </div>
            <CardDescription>Overview of all idea statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" name="Count" label={{ position: 'top', fontSize: 11, fill: '#374151' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No status data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rates Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Rate</CardTitle>
            <CardDescription>Approved / (Total - Declined)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-blue-600">
                {analytics?.approval_rate || 0}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(analytics?.approval_rate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Implementation Rate</CardTitle>
            <CardDescription>Implemented / (Total - Declined)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-emerald-600">
                {analytics?.implementation_rate || 0}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-emerald-600 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(analytics?.implementation_rate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned to T&E Rate</CardTitle>
            <CardDescription>Assigned to T&E / (Total - Declined)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-purple-600">
                {analytics?.assigned_to_te_rate || 0}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-purple-600 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(analytics?.assigned_to_te_rate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Eye-deas Section - Shows up to 5 */}
      {bestIdeas.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-yellow-900">Best Eye-deas</CardTitle>
                  <CardDescription className="text-yellow-700">Top ideas selected by the C.I. Excellence Team</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bestIdeas.map((idea) => (
                <div key={idea.id} className="bg-white p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-yellow-500 text-white">{idea.idea_number}</Badge>
                    <Award className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{idea.title}</h4>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{idea.benefits}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-yellow-100">
                    <span>By {idea.submitted_by_username}</span>
                    <Link to={`/ideas/${idea.id}`}>
                      <Button variant="ghost" size="sm" className="text-yellow-700 hover:text-yellow-800 h-7 px-2">
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </Link>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{idea.pillar}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
