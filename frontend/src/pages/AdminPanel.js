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
import { Plus, Trash2, Edit, Users, Briefcase, Building, UsersRound, Upload, Download } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [teams, setTeams] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [newPillar, setNewPillar] = useState('');
  const [newTeam, setNewTeam] = useState({ name: '', pillar: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, deptsRes, pillarsRes, teamsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/departments`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/pillars`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams`)
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setPillars(pillarsRes.data);
      setTeams(teamsRes.data);
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
        approved_departments: editingUser.approved_departments || []
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

  const downloadTemplate = () => {
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
    if (!newDepartment.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/departments`, { name: newDepartment });
      toast.success('Department added');
      setNewDepartment('');
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
    if (!newTeam.name.trim() || !newTeam.pillar) return;
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams`, newTeam);
      toast.success('Team added');
      setNewTeam({ name: '', pillar: '' });
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, departments, pillars, and teams</p>
      </div>

      <div className="mb-6">
        <Button
          data-testid="seed-data-btn"
          onClick={handleSeedData}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Seed Sample Data
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" data-testid="users-tab">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" data-testid="departments-tab">
            <Building className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="pillars" data-testid="pillars-tab">
            <Briefcase className="w-4 h-4 mr-2" />
            Pillars
          </TabsTrigger>
          <TabsTrigger value="teams" data-testid="teams-tab">
            <UsersRound className="w-4 h-4 mr-2" />
            Teams
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>View and edit user roles and assignments</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button
                    data-testid="download-template-btn"
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    data-testid="bulk-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Bulk Upload'}
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
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Pillar</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'approver' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.pillar || '-'}</TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>{user.manager || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            data-testid={`edit-user-${user.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser({
                                ...user,
                                approved_pillars: user.approved_pillars || [],
                                approved_departments: user.approved_departments || []
                              });
                              setShowUserDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`delete-user-${user.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Manage Departments</CardTitle>
              <CardDescription>Add or remove departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-3">
                <Input
                  data-testid="new-department-input"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Department name"
                />
                <Button data-testid="add-department-btn" onClick={handleAddDepartment}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    data-testid={`department-${dept.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <span className="font-medium">{dept.name}</span>
                    <Button
                      data-testid={`delete-department-${dept.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(dept.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars">
          <Card>
            <CardHeader>
              <CardTitle>Manage Pillars</CardTitle>
              <CardDescription>Add or remove organizational pillars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-3">
                <Input
                  data-testid="new-pillar-input"
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  placeholder="Pillar name"
                />
                <Button data-testid="add-pillar-btn" onClick={handleAddPillar}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    data-testid={`pillar-${pillar.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <span className="font-medium">{pillar.name}</span>
                    <Button
                      data-testid={`delete-pillar-${pillar.id}`}
                      variant="ghost"
                      size="sm"
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
            <CardHeader>
              <CardTitle>Manage Teams</CardTitle>
              <CardDescription>Add or remove teams within pillars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-3">
                <Input
                  data-testid="new-team-name-input"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Team name"
                />
                <Select value={newTeam.pillar} onValueChange={(value) => setNewTeam({ ...newTeam, pillar: value })}>
                  <SelectTrigger data-testid="new-team-pillar-select" className="w-[200px]">
                    <SelectValue placeholder="Select Pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.name}>{pillar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button data-testid="add-team-btn" onClick={handleAddTeam}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-4">
                {pillars.map((pillar) => {
                  const pillarTeams = teams.filter(t => t.pillar === pillar.name);
                  if (pillarTeams.length === 0) return null;
                  return (
                    <div key={pillar.id}>
                      <h3 className="font-semibold text-gray-900 mb-3">{pillar.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pillarTeams.map((team) => (
                          <div
                            key={team.id}
                            data-testid={`team-${team.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <span>{team.name}</span>
                            <Button
                              data-testid={`delete-team-${team.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeam(team.id)}
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
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-user-dialog">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role assignments</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    data-testid="edit-username-input"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    data-testid="edit-email-input"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                    <SelectTrigger data-testid="edit-role-select">
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
                  <Label>Pillar</Label>
                  <Select value={editingUser.pillar || ''} onValueChange={(value) => setEditingUser({ ...editingUser, pillar: value })}>
                    <SelectTrigger data-testid="edit-pillar-select">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select value={editingUser.department || ''} onValueChange={(value) => setEditingUser({ ...editingUser, department: value })}>
                    <SelectTrigger data-testid="edit-department-select">
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
                  <Label>Team</Label>
                  <Select value={editingUser.team || ''} onValueChange={(value) => setEditingUser({ ...editingUser, team: value })}>
                    <SelectTrigger data-testid="edit-team-select">
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
                <Label>Manager</Label>
                <Input
                  data-testid="edit-manager-input"
                  value={editingUser.manager || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, manager: e.target.value })}
                  placeholder="Manager username or name"
                />
              </div>

              {editingUser.role === 'approver' && (
                <>
                  <div>
                    <Label className="block mb-2">Approved Pillars (Select pillars this approver can approve)</Label>
                    <div className="flex flex-wrap gap-2">
                      {pillars.map((pillar) => (
                        <Badge
                          key={pillar.id}
                          variant="outline"
                          className={`cursor-pointer ${
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
                    <Label className="block mb-2">Approved Departments (Select departments this approver can approve)</Label>
                    <div className="flex flex-wrap gap-2">
                      {departments.map((dept) => (
                        <Badge
                          key={dept.id}
                          variant="outline"
                          className={`cursor-pointer ${
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
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
                <Button data-testid="save-user-btn" onClick={handleUpdateUser} className="bg-blue-700 hover:bg-blue-800">
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