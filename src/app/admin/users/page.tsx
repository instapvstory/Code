'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Shield,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Lock,
  Unlock
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  postCount: number;
  avatar?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { value: 'editor', label: 'Editor', color: 'bg-blue-100 text-blue-800' },
    { value: 'author', label: 'Author', color: 'bg-green-100 text-green-800' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    // Fetch users data
    const fetchUsers = async () => {
      try {
        // Mock data for now
        setTimeout(() => {
          setUsers([
            {
              id: '1',
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              status: 'active',
              lastLogin: '2024-03-15 14:30',
              createdAt: '2024-01-01',
              postCount: 24,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '2',
              name: 'Editor User',
              email: 'editor@example.com',
              role: 'editor',
              status: 'active',
              lastLogin: '2024-03-15 12:15',
              createdAt: '2024-01-15',
              postCount: 18,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '3',
              name: 'Author User',
              email: 'author@example.com',
              role: 'author',
              status: 'active',
              lastLogin: '2024-03-14 09:45',
              createdAt: '2024-02-01',
              postCount: 12,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '4',
              name: 'Viewer User',
              email: 'viewer@example.com',
              role: 'viewer',
              status: 'active',
              lastLogin: '2024-03-13 16:20',
              createdAt: '2024-02-10',
              postCount: 0,
            },
            {
              id: '5',
              name: 'Content Manager',
              email: 'content@example.com',
              role: 'editor',
              status: 'inactive',
              lastLogin: '2024-03-10 11:30',
              createdAt: '2024-02-15',
              postCount: 8,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '6',
              name: 'SEO Specialist',
              email: 'seo@example.com',
              role: 'author',
              status: 'active',
              lastLogin: '2024-03-15 10:00',
              createdAt: '2024-02-20',
              postCount: 15,
            },
            {
              id: '7',
              name: 'Marketing User',
              email: 'marketing@example.com',
              role: 'viewer',
              status: 'suspended',
              lastLogin: '2024-03-05 14:15',
              createdAt: '2024-03-01',
              postCount: 0,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '8',
              name: 'Support Admin',
              email: 'support@example.com',
              role: 'admin',
              status: 'active',
              lastLogin: '2024-03-14 13:45',
              createdAt: '2024-03-05',
              postCount: 5,
            },
            {
              id: '9',
              name: 'Guest Author',
              email: 'guest@example.com',
              role: 'author',
              status: 'inactive',
              lastLogin: '2024-03-08 09:20',
              createdAt: '2024-03-10',
              postCount: 3,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '10',
              name: 'Reviewer User',
              email: 'reviewer@example.com',
              role: 'viewer',
              status: 'active',
              lastLogin: '2024-03-12 15:30',
              createdAt: '2024-03-12',
              postCount: 0,
            },
            {
              id: '11',
              name: 'Technical Writer',
              email: 'technical@example.com',
              role: 'author',
              status: 'active',
              lastLogin: '2024-03-15 08:45',
              createdAt: '2024-03-14',
              postCount: 7,
              avatar: '/api/placeholder/100/100',
            },
            {
              id: '12',
              name: 'System Admin',
              email: 'system@example.com',
              role: 'admin',
              status: 'active',
              lastLogin: '2024-03-15 16:00',
              createdAt: '2024-03-15',
              postCount: 2,
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: newStatus } : user
    ));
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) {
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    }
  };

  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) return;
    
    setUsers(users.map(user => 
      selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
    ));
    setSelectedUsers([]);
  };

  const handleBulkSuspend = () => {
    if (selectedUsers.length === 0) return;
    
    setUsers(users.map(user => 
      selectedUsers.includes(user.id) ? { ...user, status: 'suspended' } : user
    ));
    setSelectedUsers([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage admin users and permissions</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New User</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Posts</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.reduce((sum, user) => sum + user.postCount, 0)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-blue-700">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Activate Selected
              </button>
              <button
                onClick={handleBulkSuspend}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Suspend Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => {
                const roleOption = roleOptions.find(opt => opt.value === user.role);
                const statusOption = statusOptions.find(opt => opt.value === user.status);
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex-shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleOption?.color || 'bg-gray-100 text-gray-800'}`}>
                          {roleOption?.label || user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.status === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        ) : user.status === 'suspended' ? (
                          <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-yellow-500 mr-2" />
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusOption?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusOption?.label || user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-medium">{user.postCount}</span>
                        <span className="text-sm text-gray-500 ml-1">posts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {user.lastLogin}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{user.createdAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first user'}
            </p>
            <Link
              href="/admin/users/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New User
            </Link>
          </div>
        )}

        {/* Pagination */}
        {paginatedUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + usersPerPage, filteredUsers.length)}</span> of{' '}
              <span className="font-medium">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}