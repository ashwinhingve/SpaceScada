import { ConsoleLayout } from '@/components/console/ConsoleLayout';

export default function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleLayout>{children}</ConsoleLayout>;
}
