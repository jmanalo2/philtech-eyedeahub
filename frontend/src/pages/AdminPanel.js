import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, Briefcase, Building, UsersRound, Upload, Download, Wrench, UserCog } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [teams, setTeams] = useState([]);
  const [techPersons, setTechPersons] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', pillar: '' });
  const [newPillar, setNewPillar] = useState('');
  const [newTeam, setNewTeam] = useState({ name: '', pillar: '', department: '' });
  const [newTechPerson, setNewTechPerson] = useState({ name: '', email: '', specialization: '' });
  const [newManager, setNewManager] = useState({ name: '', pillar: '', department: '', team: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadingDepts, setUploadingDepts] = useState(false);
  const [uploadingTeams, setUploadingTeams] = useState(false);
  const [uploadingManagers, setUploadingManagers] = useState(false);
  const fileInputRef = useRef(null);
  const deptsFileRef = useRef(null);
  const teamsFileRef = useRef(null);
  const managersFileRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, deptsRes, pillarsRes, teamsRes, techRes, managersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/departments`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/pillars`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tech-persons`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/managers`).catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setPillars(pillarsRes.data);
      setTeams(teamsRes.data);
      setTechPersons(techRes.data);
      setManagers(managersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${editingUser.id}`, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        team: editingUser.team,
        pillar: editingUser.pillar,
        manager: editingUser.manager,
        approved_pillars: editingUser.approved_pillars || [],
        approved_departments: editingUser.approved_departments || [],
        can_change_subrole: editingUser.can_change_subrole
      });
      toast.success('User updated successfully');
      setShowUserDialog(false);
      setEditingUser(null);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}`);
      toast.success('User deleted');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/bulk-upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} errors occurred. Check console for details.`);
      }
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadUserTemplate = () => {
    const csvContent = 'username,email,password,role,department,team,pillar,manager,approved_pillars,approved_departments\n' +
      'johndoe,john@philtech.com,password123,user,Operations,Allowance Billing,GBS,manager1,,\n' +
      'janesmith,jane@philtech.com,password123,approver,Technology,,Tech,admin,Tech;Finance,Technology;Finance';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.pillar) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/departments`, newDepartment);
      toast.success('Department added');
      setNewDepartment({ name: '', pillar: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add department');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/departments/${deptId}`);
      toast.success('Department deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  const handleAddPillar = async () => {
    if (!newPillar.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/pillars`, { name: newPillar });
      toast.success('Pillar added');
      setNewPillar('');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add pillar');
    }
  };

  const handleDeletePillar = async (pillarId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/pillars/${pillarId}`);
      toast.success('Pillar deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete pillar');
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.pillar || !newTeam.department) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams`, newTeam);
      toast.success('Team added');
      setNewTeam({ name: '', pillar: '', department: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams/${teamId}`);
      toast.success('Team deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleAddTechPerson = async () => {
    if (!newTechPerson.name.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tech-persons`, newTechPerson);
      toast.success('Tech & Engineering person added');
      setNewTechPerson({ name: '', email: '', specialization: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add tech person');
    }
  };

  const handleDeleteTechPerson = async (personId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/tech-persons/${personId}`);
      toast.success('Tech person deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete tech person');
    }
  };

  // Manager handlers
  const handleAddManager = async () => {
    if (!newManager.name.trim() || !newManager.team) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/managers`, newManager);
      toast.success('Manager added');
      setNewManager({ name: '', pillar: '', department: '', team: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add manager');
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/admin/managers/${managerId}`);
      toast.success('Manager deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete manager');
    }
  };

  // Bulk upload handlers
  const handleBulkUploadDepts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDepts(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/departments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(response.data.message);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadingDepts(false);
      e.target.value = '';
    }
  };

  const handleBulkUploadTeams = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTeams(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/teams`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(response.data.message);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadingTeams(false);
      e.target.value = '';
    }
  };

  const handleBulkUploadManagers = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingManagers(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/managers`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(response.data.message);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadingManagers(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = async (type) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/templates/${type}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleSeedData = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/seed-data`);
      toast.success('Sample data seeded successfully');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to seed data');
    }
  };

  const toggleApprovedPillar = (pillar) => {
    if (!editingUser) return;
    const current = editingUser.approved_pillars || [];
    const updated = current.includes(pillar)
      ? current.filter(p => p !== pillar)
      : [...current, pillar];
    setEditingUser({ ...editingUser, approved_pillars: updated });
  };

  const toggleApprovedDepartment = (dept) => {
    if (!editingUser) return;
    const current = editingUser.approved_departments || [];
    const updated = current.includes(dept)
      ? current.filter(d => d !== dept)
      : [...current, dept];
    setEditingUser({ ...editingUser, approved_departments: updated });
  };

  return (
    <div data-testid="admin-panel-page">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Panel</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage users, departments, pillars, and teams</p>
      </div>

      <div className="mb-4 sm:mb-6">
        <Button
          data-testid="seed-data-btn"
          onClick={handleSeedData}
          className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base"
        >
          Seed Sample Data
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <TabsList className="grid grid-cols-6 min-w-[600px] sm:min-w-0 sm:w-full">
            <TabsTrigger value="users" data-testid="users-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="pillars" data-testid="pillars-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pillars</span>
            </TabsTrigger>
            <TabsTrigger value="departments" data-testid="departments-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Depts</span>
            </TabsTrigger>
            <TabsTrigger value="teams" data-testid="teams-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <UsersRound className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="managers" data-testid="managers-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <UserCog className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Managers</span>
            </TabsTrigger>
            <TabsTrigger value="tech" data-testid="tech-tab" className="text-xs sm:text-sm px-2 sm:px-3">
              <Wrench className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">T&E</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Manage Users</CardTitle>
                  <CardDescription className="text-sm">View and edit user roles and assignments</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button
                    data-testid="download-template-btn"
                    variant="outline"
                    onClick={downloadUserTemplate}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Template
                  </Button>
                  <Button
                    data-testid="bulk-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Username</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Role</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Pillar</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Department</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Team</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">Manager</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                          <TableCell className="font-medium text-xs sm:text-sm">{user.username}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'approver' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{user.pillar || '-'}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{user.department || '-'}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden xl:table-cell">{user.team || '-'}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden xl:table-cell">{user.manager || '-'}</TableCell>
                          <TableCell className="text-right space-x-1 sm:space-x-2">
                            <Button
                              data-testid={`edit-user-${user.id}`}
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => {
                                setEditingUser({
                                  ...user,
                                  approved_pillars: user.approved_pillars || [],
                                  approved_departments: user.approved_departments || []
                                });
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              data-testid={`delete-user-${user.id}`}
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Manage Departments</CardTitle>
                  <CardDescription className="text-sm">Add or remove departments (linked to pillars)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('departments')}>
                    <Download className="w-4 h-4 mr-1" /> Template
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => deptsFileRef.current?.click()}
                    disabled={uploadingDepts}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-1" /> {uploadingDepts ? 'Uploading...' : 'Upload List'}
                  </Button>
                  <input ref={deptsFileRef} type="file" accept=".xlsx,.xls" onChange={handleBulkUploadDepts} className="hidden" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  data-testid="new-department-input"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="Department name"
                  className="flex-1 text-sm"
                />
                <Select value={newDepartment.pillar} onValueChange={(value) => setNewDepartment({ ...newDepartment, pillar: value })}>
                  <SelectTrigger data-testid="new-department-pillar-select" className="w-full sm:w-[180px] text-sm">
                    <SelectValue placeholder="Select Pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button data-testid="add-department-btn" onClick={handleAddDepartment} size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-4">
                {pillars.map((pillar) => {
                  const pillarDepts = departments.filter(d => d.pillar === pillar.name);
                  if (pillarDepts.length === 0) return null;
                  return (
                    <div key={pillar.id}>
                      <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{pillar.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {pillarDepts.map((dept) => (
                          <div
                            key={dept.id}
                            data-testid={`department-${dept.id}`}
                            className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border"
                          >
                            <span className="text-sm">{dept.name}</span>
                            <Button
                              data-testid={`delete-department-${dept.id}`}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteDepartment(dept.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Manage Pillars</CardTitle>
              <CardDescription className="text-sm">Add or remove organizational pillars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  data-testid="new-pillar-input"
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  placeholder="Pillar name"
                  className="flex-1 text-sm"
                />
                <Button data-testid="add-pillar-btn" onClick={handleAddPillar} size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    data-testid={`pillar-${pillar.id}`}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border"
                  >
                    <span className="font-medium text-sm sm:text-base">{pillar.name}</span>
                    <Button
                      data-testid={`delete-pillar-${pillar.id}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDeletePillar(pillar.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Manage Teams</CardTitle>
                  <CardDescription className="text-sm">Add or remove teams within departments</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('teams')}>
                    <Download className="w-4 h-4 mr-1" /> Template
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => teamsFileRef.current?.click()}
                    disabled={uploadingTeams}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-1" /> {uploadingTeams ? 'Uploading...' : 'Upload List'}
                  </Button>
                  <input ref={teamsFileRef} type="file" accept=".xlsx,.xls" onChange={handleBulkUploadTeams} className="hidden" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
                <Input
                  data-testid="new-team-name-input"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Team name"
                  className="flex-1 min-w-[140px] text-sm"
                />
                <Select value={newTeam.pillar} onValueChange={(value) => setNewTeam({ ...newTeam, pillar: value, department: '' })}>
                  <SelectTrigger data-testid="new-team-pillar-select" className="w-full sm:w-[140px] text-sm">
                    <SelectValue placeholder="Pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newTeam.department} 
                  onValueChange={(value) => setNewTeam({ ...newTeam, department: value })}
                  disabled={!newTeam.pillar}
                >
                  <SelectTrigger data-testid="new-team-department-select" className="w-full sm:w-[160px] text-sm">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter(d => d.pillar === newTeam.pillar)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button data-testid="add-team-btn" onClick={handleAddTeam} size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {pillars.map((pillar) => {
                  const pillarDepts = departments.filter(d => d.pillar === pillar.name);
                  const pillarTeams = teams.filter(t => t.pillar === pillar.name);
                  if (pillarTeams.length === 0) return null;
                  return (
                    <div key={pillar.id} className="border rounded-lg p-3 sm:p-4">
                      <h3 className="font-bold text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">{pillar.name}</h3>
                      {pillarDepts.map((dept) => {
                        const deptTeams = pillarTeams.filter(t => t.department === dept.name);
                        if (deptTeams.length === 0) return null;
                        return (
                          <div key={dept.id} className="ml-2 sm:ml-4 mb-3 sm:mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-xs sm:text-sm">{dept.name}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2 sm:ml-4">
                              {deptTeams.map((team) => (
                                <div
                                  key={team.id}
                                  data-testid={`team-${team.id}`}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                >
                                  <span className="text-xs sm:text-sm">{team.name}</span>
                                  <Button
                                    data-testid={`delete-team-${team.id}`}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDeleteTeam(team.id)}
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Managers Tab */}
        <TabsContent value="managers">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Manage Managers</CardTitle>
                  <CardDescription className="text-sm">Add or remove managers mapped to teams (Pillar → Department → Team → Manager)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('managers')}>
                    <Download className="w-4 h-4 mr-1" /> Template
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => managersFileRef.current?.click()}
                    disabled={uploadingManagers}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-1" /> {uploadingManagers ? 'Uploading...' : 'Upload List'}
                  </Button>
                  <input ref={managersFileRef} type="file" accept=".xlsx,.xls" onChange={handleBulkUploadManagers} className="hidden" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
                <Input
                  data-testid="new-manager-name-input"
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="Manager name"
                  className="flex-1 min-w-[140px] text-sm"
                />
                <Select value={newManager.pillar} onValueChange={(value) => setNewManager({ ...newManager, pillar: value, department: '', team: '' })}>
                  <SelectTrigger className="w-full sm:w-[140px] text-sm">
                    <SelectValue placeholder="Pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newManager.department} 
                  onValueChange={(value) => setNewManager({ ...newManager, department: value, team: '' })}
                  disabled={!newManager.pillar}
                >
                  <SelectTrigger className="w-full sm:w-[140px] text-sm">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d.pillar === newManager.pillar).map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newManager.team} 
                  onValueChange={(value) => setNewManager({ ...newManager, team: value })}
                  disabled={!newManager.department}
                >
                  <SelectTrigger className="w-full sm:w-[140px] text-sm">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.filter(t => t.department === newManager.department).map((team) => (
                      <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button data-testid="add-manager-btn" onClick={handleAddManager} size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>
              {/* Display managers grouped by hierarchy */}
              <div className="space-y-4 sm:space-y-6">
                {pillars.map((pillar) => {
                  const pillarManagers = managers.filter(m => m.pillar === pillar.name);
                  if (pillarManagers.length === 0) return null;
                  return (
                    <div key={pillar.id} className="border rounded-lg p-3 sm:p-4">
                      <h3 className="font-bold text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">{pillar.name}</h3>
                      {departments.filter(d => d.pillar === pillar.name).map((dept) => {
                        const deptManagers = pillarManagers.filter(m => m.department === dept.name);
                        if (deptManagers.length === 0) return null;
                        return (
                          <div key={dept.id} className="ml-2 sm:ml-4 mb-3 sm:mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-xs sm:text-sm">{dept.name}</h4>
                            {teams.filter(t => t.department === dept.name).map((team) => {
                              const teamManagers = deptManagers.filter(m => m.team === team.name);
                              if (teamManagers.length === 0) return null;
                              return (
                                <div key={team.id} className="ml-2 sm:ml-4 mb-2">
                                  <h5 className="text-gray-600 text-xs mb-1">{team.name}</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2 sm:ml-4">
                                    {teamManagers.map((manager) => (
                                      <div
                                        key={manager.id}
                                        data-testid={`manager-${manager.id}`}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                      >
                                        <span className="text-xs sm:text-sm">{manager.name}</span>
                                        <Button
                                          data-testid={`delete-manager-${manager.id}`}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => handleDeleteManager(manager.id)}
                                        >
                                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech & Engineering Tab */}
        <TabsContent value="tech">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Tech & Engineering Personnel</CardTitle>
              <CardDescription className="text-sm">Manage technical resources for complex idea implementation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
                <Input
                  data-testid="new-tech-name-input"
                  value={newTechPerson.name}
                  onChange={(e) => setNewTechPerson({ ...newTechPerson, name: e.target.value })}
                  placeholder="Full name"
                  className="flex-1 min-w-[140px] text-sm"
                />
                <Input
                  data-testid="new-tech-email-input"
                  type="email"
                  value={newTechPerson.email}
                  onChange={(e) => setNewTechPerson({ ...newTechPerson, email: e.target.value })}
                  placeholder="Email"
                  className="flex-1 min-w-[140px] text-sm"
                />
                <Input
                  data-testid="new-tech-specialization-input"
                  value={newTechPerson.specialization}
                  onChange={(e) => setNewTechPerson({ ...newTechPerson, specialization: e.target.value })}
                  placeholder="Specialization"
                  className="flex-1 min-w-[140px] text-sm"
                />
                <Button data-testid="add-tech-btn" onClick={handleAddTechPerson} className="bg-blue-700 hover:bg-blue-800 w-full sm:w-auto" size="sm">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Specialization</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {techPersons.map((person) => (
                        <TableRow key={person.id} data-testid={`tech-person-${person.id}`}>
                          <TableCell className="font-medium text-xs sm:text-sm">{person.name}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{person.email || '-'}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {person.specialization ? (
                              <Badge variant="outline" className="bg-blue-50 text-xs">{person.specialization}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              data-testid={`delete-tech-${person.id}`}
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteTechPerson(person.id)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-user-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">Update user information and role assignments</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Username</Label>
                  <Input
                    data-testid="edit-username-input"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    data-testid="edit-email-input"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Role</Label>
                  <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                    <SelectTrigger data-testid="edit-role-select" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="approver">Approver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Pillar</Label>
                  <Select value={editingUser.pillar || ''} onValueChange={(value) => setEditingUser({ ...editingUser, pillar: value })}>
                    <SelectTrigger data-testid="edit-pillar-select" className="text-sm">
                      <SelectValue placeholder="Select Pillar" />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((pillar) => (
                        <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Department</Label>
                  <Select value={editingUser.department || ''} onValueChange={(value) => setEditingUser({ ...editingUser, department: value })}>
                    <SelectTrigger data-testid="edit-department-select" className="text-sm">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Team</Label>
                  <Select value={editingUser.team || ''} onValueChange={(value) => setEditingUser({ ...editingUser, team: value })}>
                    <SelectTrigger data-testid="edit-team-select" className="text-sm">
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Manager</Label>
                <Input
                  data-testid="edit-manager-input"
                  value={editingUser.manager || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, manager: e.target.value })}
                  placeholder="Manager username or name"
                  className="text-sm"
                />
              </div>

              {editingUser.role === 'approver' && (
                <>
                  <div>
                    <Label className="block mb-2 text-sm">Approved Pillars (Select pillars this approver can approve)</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {pillars.map((pillar) => (
                        <Badge
                          key={pillar.id}
                          variant="outline"
                          className={`cursor-pointer text-xs ${
                            editingUser.approved_pillars?.includes(pillar.name)
                              ? 'bg-blue-100 border-blue-500'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => toggleApprovedPillar(pillar.name)}
                        >
                          {pillar.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-2 text-sm">Approved Departments (Select departments this approver can approve)</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {departments.map((dept) => (
                        <Badge
                          key={dept.id}
                          variant="outline"
                          className={`cursor-pointer text-xs ${
                            editingUser.approved_departments?.includes(dept.name)
                              ? 'bg-green-100 border-green-500'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => toggleApprovedDepartment(dept.name)}
                        >
                          {dept.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Allow Sub-role Change</Label>
                      <p className="text-xs text-gray-500 mt-0.5">When disabled, user cannot change their sub-role in Profile</p>
                    </div>
                    <button
                      type="button"
                      data-testid="toggle-can-change-subrole"
                      onClick={() => setEditingUser({ 
                        ...editingUser, 
                        can_change_subrole: editingUser.can_change_subrole === false ? true : false 
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editingUser.can_change_subrole !== false ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editingUser.can_change_subrole !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowUserDialog(false)} className="order-2 sm:order-1">Cancel</Button>
                <Button data-testid="save-user-btn" onClick={handleUpdateUser} className="bg-blue-700 hover:bg-blue-800 order-1 sm:order-2">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}