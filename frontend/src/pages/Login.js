import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
// Logo image used instead of Lightbulb icon

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pillars, setPillars] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    pillar: '',
    department: '',
    team: '',
    manager: ''
  });
  const [filteredManagers, setFilteredManagers] = useState([]);

  useEffect(() => {
    fetchOrganizationalData();
  }, []);

  useEffect(() => {
    if (registerForm.pillar) {
      const filtered = departments.filter(dept => dept.pillar === registerForm.pillar);
      setFilteredDepartments(filtered);
      setRegisterForm(prev => ({ ...prev, department: '', team: '', manager: '' }));
    } else {
      setFilteredDepartments([]);
    }
  }, [registerForm.pillar, departments]);

  useEffect(() => {
    if (registerForm.department) {
      const filtered = teams.filter(team => team.department === registerForm.department);
      setFilteredTeams(filtered);
      setRegisterForm(prev => ({ ...prev, team: '', manager: '' }));
    } else {
      setFilteredTeams([]);
    }
  }, [registerForm.department, teams]);

  useEffect(() => {
    if (registerForm.team) {
      const filtered = managers.filter(m => m.team === registerForm.team);
      setFilteredManagers(filtered);
      setRegisterForm(prev => ({ ...prev, manager: '' }));
    } else {
      setFilteredManagers([]);
    }
  }, [registerForm.team, managers]);

  const fetchOrganizationalData = async () => {
    try {
      // Use public endpoints that don't require authentication
      const [pillarsRes, deptsRes, teamsRes, managersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/pillars`).catch(() => ({ data: [] })),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/departments`).catch(() => ({ data: [] })),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/teams`).catch(() => ({ data: [] })),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/public/managers`).catch(() => ({ data: [] }))
      ]);
      setPillars(pillarsRes.data);
      setDepartments(deptsRes.data);
      setTeams(teamsRes.data);
      setManagers(managersRes.data);
    } catch (error) {
      console.error('Failed to fetch organizational data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.username, loginForm.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!registerForm.manager.trim()) {
      toast.error('Manager name is required');
      return;
    }
    setLoading(true);
    try {
      const userData = {
        username: registerForm.username,
        email: registerForm.email,
        first_name: registerForm.first_name || undefined,
        last_name: registerForm.last_name || undefined,
        password: registerForm.password,
        role: registerForm.role,
        pillar: registerForm.pillar || undefined,
        department: registerForm.department || undefined,
        team: registerForm.team || undefined,
        manager: registerForm.manager
      };
      
      await register(userData);
      toast.success('Registration successful! Please login.');
      setRegisterForm({ 
        username: '', 
        email: '', 
        first_name: '',
        last_name: '',
        password: '', 
        confirmPassword: '',
        role: 'user',
        pillar: '',
        department: '',
        team: '',
        manager: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Floating circles */}
        <div className="absolute top-20 left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-10 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-cyan-400/8 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="flex items-center mb-6" style={{ gap: 0 }}>
            <img src="/eyedea-logo.png" alt="Eye" style={{ width: '120px', height: '120px', marginRight: '-4px', filter: 'brightness(0) saturate(100%) invert(100%)' }} />
            <span className="text-7xl font-extrabold text-white tracking-tight">DEA</span>
          </div>
          <div className="w-16 h-0.5 bg-blue-400/50 rounded-full mb-6" />
          <p className="text-blue-200 text-lg font-light text-center max-w-sm leading-relaxed">
            Innovation Management System
          </p>
          <p className="text-blue-400/60 text-sm mt-3 text-center max-w-xs">
            Submit, evaluate and track ideas that drive organizational improvement
          </p>

          <Link to="/demo" className="mt-8">
            <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm btn-press" data-testid="watch-demo-btn">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Watch Demo
            </Button>
          </Link>

          {/* Tech dots decoration */}
          <div className="absolute bottom-12 left-12 flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/30" />
            ))}
          </div>
          <div className="absolute top-12 right-12 flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/20" />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-10 relative">
        {/* Subtle top-right accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-[80px] -z-0" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-2" style={{ gap: 0 }}>
              <img src="/eyedea-logo.png" alt="Eye" style={{ width: '80px', height: '80px', marginRight: '-2px', filter: 'brightness(0) saturate(100%) invert(12%) sepia(63%) saturate(3000%) hue-rotate(210deg) brightness(0.85)' }} />
              <span className="text-5xl font-extrabold text-blue-900 tracking-tight">DEA</span>
            </div>
            <p className="text-gray-500 text-sm">Innovation Management System</p>
          </div>

          <div className="mb-8 animate-slide-down">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account or create a new one</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/80 p-1 rounded-xl">
              <TabsTrigger value="login" data-testid="login-tab" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" data-testid="login-form">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="login-username" className="text-gray-700 text-sm font-medium">Username</Label>
                  <Input
                    id="login-username"
                    data-testid="login-username-input"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="mt-1.5 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-gray-700 text-sm font-medium">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="mt-1.5 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit-btn"
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-700/25 btn-press"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot Password?
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" data-testid="register-form">
              <form onSubmit={handleRegister} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="register-first-name" className="text-gray-700 text-sm font-medium">First Name</Label>
                    <Input
                      id="register-first-name"
                      data-testid="register-first-name-input"
                      value={registerForm.first_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                      className="mt-1.5 h-10 border-gray-200 rounded-xl"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-last-name" className="text-gray-700 text-sm font-medium">Last Name</Label>
                    <Input
                      id="register-last-name"
                      data-testid="register-last-name-input"
                      value={registerForm.last_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                      className="mt-1.5 h-10 border-gray-200 rounded-xl"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="register-username" className="text-gray-700 text-sm font-medium">Username *</Label>
                  <Input
                    id="register-username"
                    data-testid="register-username-input"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="mt-1.5 h-10 border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-email" className="text-gray-700 text-sm font-medium">Email *</Label>
                  <Input
                    id="register-email"
                    data-testid="register-email-input"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="mt-1.5 h-10 border-gray-200 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="register-pillar" className="text-gray-700 text-sm font-medium">Pillar</Label>
                  <Select value={registerForm.pillar} onValueChange={(value) => setRegisterForm({ ...registerForm, pillar: value })}>
                    <SelectTrigger data-testid="register-pillar-select" className="mt-1.5 h-10 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select Pillar" />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((pillar) => (
                        <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {registerForm.pillar && (
                  <div>
                    <Label htmlFor="register-department" className="text-gray-700 text-sm font-medium">Department</Label>
                    <Select value={registerForm.department} onValueChange={(value) => setRegisterForm({ ...registerForm, department: value })}>
                      <SelectTrigger data-testid="register-department-select" className="mt-1.5 h-10 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {registerForm.department && (
                  <div>
                    <Label htmlFor="register-team" className="text-gray-700 text-sm font-medium">Team</Label>
                    <Select value={registerForm.team} onValueChange={(value) => setRegisterForm({ ...registerForm, team: value })}>
                      <SelectTrigger data-testid="register-team-select" className="mt-1.5 h-10 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTeams.map((team) => (
                          <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="register-manager" className="text-gray-700 text-sm font-medium">Manager's Full Name *</Label>
                  {registerForm.team && filteredManagers.length > 0 ? (
                    <Select value={registerForm.manager} onValueChange={(value) => setRegisterForm({ ...registerForm, manager: value })}>
                      <SelectTrigger data-testid="register-manager-select" className="mt-1.5 h-10 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="register-manager"
                      data-testid="register-manager-input"
                      value={registerForm.manager}
                      onChange={(e) => setRegisterForm({ ...registerForm, manager: e.target.value })}
                      className="mt-1.5 h-10 border-gray-200 rounded-xl"
                      placeholder={registerForm.team ? "No managers found - enter name manually" : "Select a team first or enter manager's name"}
                      required
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password" className="text-gray-700 text-sm font-medium">Password *</Label>
                  <Input
                    id="register-password"
                    data-testid="register-password-input"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="mt-1.5 h-10 border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-confirm-password" className="text-gray-700 text-sm font-medium">Confirm Password *</Label>
                  <Input
                    id="register-confirm-password"
                    data-testid="register-confirm-password-input"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="mt-1.5 h-10 border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="register-submit-btn"
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-700/25 btn-press"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
