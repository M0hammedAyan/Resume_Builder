import { FileText, Eye, LayoutTemplate, LineChart } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    to: "/resume/studio",
    label: "Resume Studio",
    caption: "Edit and export",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    to: "/recruiter-lens",
    label: "Recruiter Lens",
    caption: "JD analysis",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    to: "/templates",
    label: "Templates",
    caption: "Preview and apply",
    icon: <LayoutTemplate className="h-4 w-4" />,
  },
  {
    to: "/insights",
    label: "Insights",
    caption: "Analytics",
    icon: <LineChart className="h-4 w-4" />,
  },
];

function AppSidebarNav() {
  return (
    <aside className="fixed left-4 top-6 z-20 hidden w-56 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur lg:block">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-950">CareerOS</p>
        <p className="text-xs text-slate-500">Workspace</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs opacity-75">{item.caption}</span>
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AppSidebarNav;