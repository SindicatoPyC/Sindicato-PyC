import Navbar from '../../components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}