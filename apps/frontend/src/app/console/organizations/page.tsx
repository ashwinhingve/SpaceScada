'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, MoreVertical, Trash2, Edit, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Organization {
  id: string;
  name: string;
  description: string;
  projectCount: number;
  deviceCount: number;
  memberCount: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const organizations: Organization[] = [
    {
      id: 'org-001',
      name: 'Space Auto Tech',
      description: 'Main organization for industrial automation',
      projectCount: 5,
      deviceCount: 42,
      memberCount: 8,
      createdAt: '2025-08-01',
    },
    {
      id: 'org-002',
      name: 'Dahi Facility',
      description: 'Manufacturing facility organization',
      projectCount: 2,
      deviceCount: 15,
      memberCount: 3,
      createdAt: '2025-09-10',
    },
  ];

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/console" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <span className="text-gray-600">&gt;</span>
          <span className="text-white">Organizations</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Organizations</h1>
          <p className="text-gray-400">
            Manage multi-tenancy and team access control
          </p>
          <div className="mt-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm inline-block">
            ⚠ Demo Mode: Backend not yet implemented
          </div>
        </div>
        <Button className="bg-gray-600 hover:bg-gray-700 cursor-not-allowed" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-[#1E293B] border-gray-800 mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border-gray-700 text-gray-300 pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="bg-[#1E293B] border-gray-800 hover:border-blue-500/50 transition-all">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <Link
                      href={`/console/organizations/${org.id}`}
                      className="text-white font-semibold hover:text-blue-400 transition-colors"
                    >
                      {org.name}
                    </Link>
                    <div className="text-gray-400 text-sm">{org.id}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700">
                    <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {org.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{org.projectCount}</div>
                  <div className="text-xs text-gray-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{org.deviceCount}</div>
                  <div className="text-xs text-gray-400">Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{org.memberCount}</div>
                  <div className="text-xs text-gray-400">Members</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-500">
                  Created {new Date(org.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrganizations.length === 0 && (
        <Card className="bg-[#1E293B] border-gray-800">
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No organizations found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first organization'}
            </p>
            {!searchQuery && (
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/console/organizations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
