import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginRequest, isSSOConfigured, msalInstance as msalApp } from '../auth/msalConfig';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export default function Login() {
  const { login, ssoLogin, register, ssoConfig } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [pillars, setPillars] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);

  const ssoAvailable = isSSOConfigured() && ssoConfig?.sso_enabled;
  const localLoginAvailable = !ssoConfig?.sso_enabled || ssoConfig?.dev_mode_login_enabled;

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

  const handleSSOLogin = async () => {
    if (!msalApp) return;
    
    setSsoLoading(true);
    try {
      // Trigger Microsoft login popup
      const response = await msalApp.loginPopup(loginRequest);
      
      if (response?.idToken) {
        // Exchange Azure AD token for internal app token
        await ssoLogin(response.idToken);
        toast.success('Microsoft SSO login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('SSO login error:', error);
      if (error.errorCode === 'user_cancelled') {
        toast.info('Login cancelled');
      } else {
        toast.error(error.message || 'Microsoft SSO login failed');
      }
    } finally {
      setSsoLoading(false);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100">
      {/* Left Panel - Branding */}
      <div className="relative flex min-h-[38vh] w-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-900 lg:min-h-screen lg:w-[48%]">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute -top-16 left-8 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10 flex w-full items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
            <div className="mb-8 w-full rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm sm:p-8">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
                <img src="/Nex the navigator.png" alt="NEXT Navigator" style={{ width: '150px', height: 'auto' }} />
                <img src="/NEX.png" alt="GBS NEXT" style={{ width: '126px', height: 'auto' }} />
              </div>
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.34em] text-cyan-100/90">NEXT CI Web App</p>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">GBS NEXT</h1>
            <p className="mb-4 max-w-md text-xl font-semibold leading-relaxed text-white sm:text-2xl">
              Welcome NEXT CI Ambassadors
            </p>
            <p className="max-w-md text-sm leading-7 text-blue-100/80 sm:text-base">
              Navigate Efficiency through Xcellence &amp; Transformation
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="relative flex w-full items-center justify-center bg-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:min-h-screen lg:w-[52%] lg:px-8 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="relative z-10 w-full max-w-[440px]">
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-[28px]">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to continue to GBS NEXT
                </p>
              </div>

          {/* Microsoft SSO Login Button */}
          {ssoAvailable && (
            <div className="mb-6">
              <Button
                type="button"
                onClick={handleSSOLogin}
                disabled={ssoLoading}
                className="w-full h-12 bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-3"
                data-testid="sso-login-btn"
              >
                {/* Microsoft logo */}
                <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                {ssoLoading ? 'Signing in with Microsoft...' : 'Sign in with Microsoft'}
              </Button>
              {localLoginAvailable && (
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400">or sign in with credentials</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {localLoginAvailable && (
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
          )}

          {/* SSO-only mode: show hint if local login is hidden */}
          {ssoAvailable && !localLoginAvailable && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Corporate Microsoft account required. Contact your admin if you cannot access.
            </p>
          )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
