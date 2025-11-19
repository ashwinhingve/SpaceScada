'use client';

import { use } from 'react';
import Link from 'next/link';
import { Settings, Trash2, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/hooks/useProjects';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, loading, error } = useProject(id);

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-gray-400">Loading project...</div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-red-400">{error || 'Project not found'}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={project.name}
        description={project.description}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
      />

      <div className="space-y-6">
        {/* Project Info Card */}
        <Card className="bg-[#151f2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>General Information</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Project ID</div>
                <div className="text-white font-mono">{project.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Status</div>
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
              <div>
                <div className="text-sm text-gray-400">Devices</div>
                <div className="text-white">{project.deviceCount} devices</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Created</div>
                <div className="text-white">{new Date(project.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Devices Card */}
        <Card className="bg-[#151f2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Devices</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/devices/new?projectId=${project.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {project.deviceCount === 0 ? (
              <EmptyState
                icon={Plus}
                title="No devices yet"
                description="Add devices to this project to start monitoring"
                action={{
                  label: 'Add Device',
                  href: `/devices/new?projectId=${project.id}`,
                }}
              />
            ) : (
              <div className="text-gray-400">{project.deviceCount} device(s) in this project</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
