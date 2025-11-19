'use client';

import { ArrowRight, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Column, DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Entity {
  id: string;
  name: string;
  type: 'application' | 'gateway' | 'device';
  status: string;
  lastSeen?: string;
}

export interface TopEntitiesProps {
  entities: Entity[];
  onViewAll?: () => void;
  onEntityClick?: (entity: Entity) => void;
}

export function TopEntities({ entities, onViewAll, onEntityClick }: TopEntitiesProps) {
  // Filter entities by type
  const applications = entities.filter((e) => e.type === 'application');
  const gateways = entities.filter((e) => e.type === 'gateway');
  const devices = entities.filter((e) => e.type === 'device');

  const columns: Column<Entity>[] = [
    {
      key: 'type',
      title: 'TYPE',
      width: '60px',
      render: (entity) => {
        const icons = {
          application: '💻',
          gateway: '📡',
          device: '⚙️',
        };
        return <span className="text-lg">{icons[entity.type]}</span>;
      },
    },
    {
      key: 'name',
      title: 'NAME',
      sortable: true,
      render: (entity) => (
        <div className="flex flex-col">
          <span className="font-medium">{entity.name}</span>
          <span className="text-xs text-muted-foreground">{entity.id}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'STATUS / LAST SEEN',
      sortable: true,
      render: (entity) => {
        return (
          <div className="flex items-center gap-2">
            <span>{entity.status}</span>
            <span
              className={`h-2 w-2 rounded-full ${
                entity.status === 'Connected'
                  ? 'bg-green-500'
                  : entity.status === 'Disconnected'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <CardTitle>Top entities</CardTitle>
        </div>
        {onViewAll && (
          <Button variant="link" onClick={onViewAll} className="text-primary hover:text-primary/80">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="gateways">Gateways</TabsTrigger>
            <TabsTrigger value="devices">End devices</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <DataTable
              data={entities}
              columns={columns}
              onRowClick={onEntityClick}
              emptyMessage="No entities found"
            />
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <DataTable
              data={applications}
              columns={columns}
              onRowClick={onEntityClick}
              emptyMessage="No applications found"
            />
          </TabsContent>

          <TabsContent value="gateways" className="mt-4">
            <DataTable
              data={gateways}
              columns={columns}
              onRowClick={onEntityClick}
              emptyMessage="No gateways found"
            />
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <DataTable
              data={devices}
              columns={columns}
              onRowClick={onEntityClick}
              emptyMessage="No devices found"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
