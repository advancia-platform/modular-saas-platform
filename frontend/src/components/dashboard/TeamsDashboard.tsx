'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FolderOpen,
  Calendar,
  Plus,
  Settings,
  MoreVertical,
  UserPlus,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  members: TeamMember[];
  projects: Project[];
  _count: {
    members: number;
    projects: number;
  };
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface Project {
  id: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
}

const TeamCard: React.FC<{ team: Team; onEdit: (team: Team) => void; onAddMember: (team: Team) => void; onViewProjects: (team: Team) => void }> = ({
  team,
  onEdit,
  onAddMember,
  onViewProjects
}) => {
  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'MEMBER': return 'bg-green-100 text-green-800';
      case 'VIEWER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <CardDescription className="mt-1">
              {team.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddMember(team)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewProjects(team)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                View Projects
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {team._count.members} member{team._count.members !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <FolderOpen className="mr-1 h-4 w-4" />
              {team._count.projects} project{team._count.projects !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Created {new Date(team.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Team Owner */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Owner:</span>
            <span className="text-sm font-medium">{team.owner.username}</span>
            <Badge variant="outline" className={getRoleColor('OWNER')}>
              OWNER
            </Badge>
          </div>

          {/* Recent Members */}
          {team.members.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Recent Members:</p>
              <div className="flex flex-wrap gap-2">
                {team.members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center space-x-1 text-xs">
                    <span>{member.user.username}</span>
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
                {team.members.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{team.members.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          {team.projects.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Recent Projects:</p>
              <div className="flex flex-wrap gap-2">
                {team.projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center space-x-1 text-xs">
                    <span>{project.name}</span>
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
                {team.projects.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{team.projects.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TeamsDashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setTeams(data.teams || []);
      } else {
        setError(data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    // TODO: Implement create team modal/form
    console.log('Create team clicked');
  };

  const handleEditTeam = (team: Team) => {
    // TODO: Implement edit team modal/form
    console.log('Edit team:', team);
  };

  const handleAddMember = (team: Team) => {
    // TODO: Implement add member modal/form
    console.log('Add member to team:', team);
  };

  const handleViewProjects = (team: Team) => {
    // TODO: Navigate to team projects view
    console.log('View projects for team:', team);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading teams</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fetchTeams()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and collaborate on projects
          </p>
        </div>
        <Button onClick={handleCreateTeam} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No teams yet</h3>
              <p className="mt-2 text-muted-foreground">
                Get started by creating your first team to collaborate with others.
              </p>
              <Button onClick={handleCreateTeam} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEditTeam}
              onAddMember={handleAddMember}
              onViewProjects={handleViewProjects}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsDashboard;
