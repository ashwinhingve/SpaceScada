'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { formatRelativeTime } from '@/lib/format';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const { projects, loading, error } = useProjects();

  const filteredProjects = projects.filter((project) =>
    project?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Projects"
        description="Manage your SCADA projects and applications"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Projects' }]}
        action={{
          label: 'Create Project',
          href: '/projects/new',
        }}
      />

      <div className="space-y-6">
        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Projects list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading projects...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No projects found"
            description="Get started by creating your first project"
            action={{
              label: 'Create Project',
              href: '/projects/new',
            }}
          />
        ) : (
          <div className="bg-[#151f2e] rounded-lg border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">
                Projects ({filteredProjects.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Devices</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Created</div>
              </div>
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="font-medium text-white">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-400 truncate">{project.description}</div>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center text-gray-300">
                    {project.deviceCount} devices
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant={
                        project.status === 'ONLINE'
                          ? 'default'
                          : project.status === 'ERROR'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          project.status === 'ONLINE'
                            ? 'bg-green-500'
                            : project.status === 'ERROR'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`}
                      />
                      {project.status}
                    </Badge>
                  </div>
                  <div className="col-span-3 flex items-center text-gray-400">
                    {formatRelativeTime(project.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
