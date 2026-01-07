import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield, Building, Users } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      approver: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return variants[role] || variants.user;
  };

  return (
    <div data-testid="profile-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">View your account information and access details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal and organizational details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                  <Badge className={getRoleBadge(user.role)} data-testid="user-role-badge">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-semibold">Email</span>
                    </div>
                    <p className="text-gray-900" data-testid="user-email">{user.email}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-semibold">Role</span>
                    </div>
                    <p className="text-gray-900">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-semibold">Department</span>
                    </div>
                    <p className="text-gray-900" data-testid="user-department">{user.department || 'Not assigned'}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">Team</span>
                    </div>
                    <p className="text-gray-900" data-testid="user-team">{user.team || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access & Security Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Access & Security</CardTitle>
              <CardDescription>Your permissions and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Permissions</h3>
                <ul className="space-y-2 text-sm">
                  {user.role === 'admin' && (
                    <>
                      <li className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-700 rounded-full mr-2"></span>
                        Full system access
                      </li>
                      <li className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-700 rounded-full mr-2"></span>
                        Manage users
                      </li>
                      <li className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-700 rounded-full mr-2"></span>
                        Manage departments & pillars
                      </li>
                    </>
                  )}
                  {user.role === 'approver' && (
                    <>
                      <li className="flex items-center text-blue-700">
                        <span className="w-2 h-2 bg-blue-700 rounded-full mr-2"></span>
                        Approve Eye-deas
                      </li>
                      <li className="flex items-center text-blue-700">
                        <span className="w-2 h-2 bg-blue-700 rounded-full mr-2"></span>
                        Request revisions
                      </li>
                      <li className="flex items-center text-blue-700">
                        <span className="w-2 h-2 bg-blue-700 rounded-full mr-2"></span>
                        Decline submissions
                      </li>
                    </>
                  )}
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-700 rounded-full mr-2"></span>
                    Submit Eye-deas
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-700 rounded-full mr-2"></span>
                    View all Eye-deas
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-700 rounded-full mr-2"></span>
                    Add comments
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Account Status</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}