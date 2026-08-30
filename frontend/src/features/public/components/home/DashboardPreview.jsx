import { ArrowRight, LayoutDashboard, Settings2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../../../../components/ui/Layout/Container';
import { Button } from '../../../../components/ui/Button/Button';
import { SectionHeader } from '../../../../components/common/SectionHeader';
import { ROUTES } from '../../../../constants/routes.constant';
import { ROLES } from '../../../../constants/roles.constant';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from "../../../../context/ThemeContext";
import customerLight from "../../../../assets/images/dashboards/customer-dashboard-light.png";
import customerDark from "../../../../assets/images/dashboards/customer-dashboard-dark.png";
import providerLight from "../../../../assets/images/dashboards/provider-dashboard-light.png";
import providerDark from "../../../../assets/images/dashboards/provider-dashboard-dark.png";
import adminLight from "../../../../assets/images/dashboards/admin-dashboard-light.png";
import adminDark from "../../../../assets/images/dashboards/admin-dashboard-dark.png";



// const dashboards = [
//   {
//     role: ROLES.CUSTOMER,
//     title: 'Customer Dashboard',
//     description: 'Book services, track updates, confirm final amount, and review providers.',
//     route: ROUTES.customer.dashboard,
//     icon: UserRound,
//     tone: 'from-blue-500/15 to-teal-500/15',
//   },
//   {
//     role: ROLES.PROVIDER,
//     title: 'Provider Dashboard',
//     description: 'Accept nearby jobs, update work status, submit final amount, and track earnings.',
//     route: ROUTES.provider.dashboard,
//     icon: LayoutDashboard,
//     image: 'https://images.unsplash.com/photo-1782827397217-e84ce8f05a6f?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
//   },
//   {
//     role: ROLES.ADMIN,
//     title: 'Admin Dashboard',
//     description: 'Manage providers, bookings, support messages, payments, and settlements.',
//     route: ROUTES.admin.dashboard,
//     icon: Settings2,
//     tone: 'from-slate-500/15 to-blue-500/15',
//   },
// ];

// function Mockup({ tone }) {
//   return (
//     <div className={`rounded-2xl bg-gradient-to-br ${tone} border border-[var(--sf-border)] p-4`}>
//       <div className="flex gap-2">
//         <span className="h-3 w-3 rounded-full bg-[var(--sf-secondary)]" />
//         <span className="h-3 w-3 rounded-full bg-[var(--sf-accent)]" />
//         <span className="h-3 w-3 rounded-full bg-[var(--sf-primary)]" />
//       </div>
//       <div className="mt-5 grid grid-cols-[0.35fr_1fr] gap-3">
//         <div className="space-y-2">
//           <span className="block h-8 rounded-xl bg-[var(--sf-surface)] opacity-80" />
//           <span className="block h-8 rounded-xl bg-[var(--sf-surface)] opacity-70" />
//           <span className="block h-8 rounded-xl bg-[var(--sf-surface)] opacity-60" />
//         </div>
//         <div className="space-y-3">
//           <span className="block h-10 rounded-xl bg-[var(--sf-surface)] opacity-80" />
//           <span className="block h-20 rounded-xl bg-[var(--sf-surface)] opacity-70" />
//           <span className="block h-8 rounded-xl bg-[var(--sf-surface)] opacity-75" />
//         </div>
//       </div>
//     </div>
//   );
// }

const dashboards = [
  {
    role: ROLES.CUSTOMER,
    title: "Customer Dashboard",
    description:
      "Book services, track updates, confirm final amount, and review providers.",
    route: ROUTES.customer.dashboard,
    icon: UserRound,
    images: {
      light: customerLight,
      dark: customerDark,
    },
  },
  {
    role: ROLES.PROVIDER,
    title: "Provider Dashboard",
    description:
      "Accept nearby jobs, update work status, submit final amount, and track earnings.",
    route: ROUTES.provider.dashboard,
    icon: LayoutDashboard,
    images: {
      light: providerLight,
      dark: providerDark,
    },
  },
  {
    role: ROLES.ADMIN,
    title: "Admin Dashboard",
    description:
      "Manage providers, bookings, support messages, payments, and settlements.",
    route: ROUTES.admin.dashboard,
    icon: Settings2,
    images: {
      light: adminLight,
      dark: adminDark,
    },
  },
];


export function DashboardPreview() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  const resolveRoute = (item) => {
    if (isAuthenticated && user?.role === item.role) return item.route;
    return ROUTES.login;
  };

  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          title="Separate Dashboards for Customers, Providers, and Admins"
          description="Each role gets the tools needed for its part of the same service lifecycle."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
                {/* <Mockup tone={item.image} /> */}
                <div className="overflow-hidden rounded-2xl border border-[var(--sf-border)]">
                    <img
                        src={theme === "dark" ? item.images.dark : item.images.light}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-56 w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                </div>
                <div className="mt-6 flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-[var(--sf-text-main)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p>
                  </div>
                </div>
                <Button as={Link} to={resolveRoute(item)} variant="outline" className="mt-6 w-full rounded-xl">
                  View dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default DashboardPreview;
