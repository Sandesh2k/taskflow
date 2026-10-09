import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export default function DashboardLayout({ children, userName = "User" }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar userName={userName} />
      <div className="flex-1 lg:ml-64 ml-0">
        <DashboardHeader userName={userName} />
        <main className="pt-16 lg:pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
