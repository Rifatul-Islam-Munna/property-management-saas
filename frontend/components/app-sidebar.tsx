"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  BellIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CommandIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileChartColumnIcon,
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  RepeatIcon,
  Settings2Icon,
  ShieldIcon,
  TicketIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"
import { useLogoutMutation, useMeQuery } from "@/hooks/use-auth"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function buildNav(role: string | undefined, pathname: string) {
  if (role === "tetentwoner") {
    return {
      brand: "Tenant Owner",
      navMain: [
        {
          label: "Overview",
          items: [
            { title: "Overview", url: "/dashboard/tenant-owner", icon: <LayoutDashboardIcon /> },
          ],
        },
        {
          label: "Portfolio",
          items: [
            { title: "Properties", url: "/dashboard/tenant-owner/properties", icon: <Building2Icon /> },
            { title: "Units", url: "/dashboard/tenant-owner/units", icon: <HomeIcon /> },
          ],
        },
        {
          label: "People",
          items: [
            { title: "Users", url: "/dashboard/tenant-owner/users", icon: <UsersIcon /> },
            { title: "Tenants", url: "/dashboard/tenant-owner/tenants", icon: <ShieldIcon /> },
            { title: "Billing", url: "/dashboard/tenant-owner/billing", icon: <CreditCardIcon /> },
            { title: "Technicians", url: "/dashboard/tenant-owner/technicians", icon: <WrenchIcon /> },
          ],
        },
        {
          label: "Communication",
          items: [
            { title: "Notices", url: "/dashboard/tenant-owner/notices", icon: <BellIcon /> },
            { title: "Documents", url: "/dashboard/tenant-owner/documents", icon: <FileTextIcon /> },
          ],
        },
        {
          label: "Operations",
          items: [
            { title: "Vendors", url: "/dashboard/tenant-owner/vendors", icon: <BriefcaseBusinessIcon /> },
            { title: "Tickets", url: "/dashboard/tenant-owner/tickets", icon: <CreditCardIcon /> },
            { title: "Recurring", url: "/dashboard/tenant-owner/recurring", icon: <RepeatIcon /> },
            { title: "Inspections", url: "/dashboard/tenant-owner/inspections", icon: <FileChartColumnIcon /> },
          ],
        },
      ].map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, isActive: pathname === item.url })),
      })),
      navSecondary: [
        { title: "Settings", url: "/dashboard/tenant-owner/settings", icon: <Settings2Icon />, isActive: pathname === "/dashboard/tenant-owner/settings" },
      ],
    }
  }

  if (role === "super_admin" || role === "admin") {
    return {
      brand: "Admin",
      navMain: [
        {
          label: "Overview",
          items: [
            { title: "Overview", url: "/dashboard/admin", icon: <LayoutDashboardIcon />, isActive: pathname === "/dashboard/admin" },
          ],
        },
        {
          label: "Core",
          items: [
            { title: "Users", url: "/dashboard/admin/users", icon: <UsersIcon /> },
            { title: "Organizations", url: "/dashboard/admin/organizations", icon: <Building2Icon /> },
            { title: "Plans", url: "/dashboard/admin/plans", icon: <CreditCardIcon /> },
            { title: "Subscriptions", url: "/dashboard/admin/subscriptions", icon: <FileTextIcon /> },
          ],
        },
        {
          label: "Operations",
          items: [
            { title: "Properties", url: "/dashboard/admin/properties", icon: <HomeIcon /> },
            { title: "Tenants", url: "/dashboard/admin/tenants", icon: <ShieldIcon /> },
            { title: "Technicians", url: "/dashboard/admin/technicians", icon: <WrenchIcon /> },
          ],
        },
      ].map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, isActive: pathname === item.url })),
      })),
      navSecondary: [],
    }
  }

  if (role === "worker") {
    return {
      brand: "Worker",
      navMain: [
        {
          label: "Workspace",
          items: [
            { title: "Overview", url: "/dashboard/worker", icon: <LayoutDashboardIcon />, isActive: pathname === "/dashboard/worker" },
            { title: "Tickets", url: "/dashboard/worker/tickets", icon: <TicketIcon />, isActive: pathname === "/dashboard/worker/tickets" },
            { title: "Inspections", url: "/dashboard/worker/inspections", icon: <FileChartColumnIcon />, isActive: pathname === "/dashboard/worker/inspections" },
            { title: "Recurring", url: "/dashboard/worker/recurring", icon: <RepeatIcon />, isActive: pathname === "/dashboard/worker/recurring" },
            { title: "Messages", url: "/dashboard/worker/messages", icon: <FileTextIcon />, isActive: pathname === "/dashboard/worker/messages" },
          ],
        },
      ],
      navSecondary: [
        { title: "Settings", url: "/dashboard/worker/settings", icon: <Settings2Icon />, isActive: pathname === "/dashboard/worker/settings" },
      ],
    }
  }

  return {
    brand: "Resident",
    navMain: [
      {
        label: "Overview",
        items: [
          { title: "Overview", url: "/dashboard/resident", icon: <LayoutDashboardIcon />, isActive: pathname === "/dashboard/resident" },
        ],
      },
      {
        label: "Portfolio",
        items: [
          { title: "Properties", url: "/dashboard/resident/properties", icon: <Building2Icon /> },
          { title: "Units", url: "/dashboard/resident/units", icon: <HomeIcon /> },
        ],
      },
      {
        label: "People",
        items: [
          { title: "Users", url: "/dashboard/resident/users", icon: <UsersIcon /> },
          { title: "Tenants", url: "/dashboard/resident/tenants", icon: <ShieldIcon /> },
          { title: "Billing", url: "/dashboard/resident/billing", icon: <CreditCardIcon /> },
          { title: "Technicians", url: "/dashboard/resident/technicians", icon: <WrenchIcon /> },
        ],
      },
      {
        label: "Communication",
        items: [
          { title: "Notices", url: "/dashboard/resident/notices", icon: <BellIcon /> },
          { title: "Documents", url: "/dashboard/resident/documents", icon: <FileTextIcon /> },
        ],
      },
      {
        label: "Operations",
        items: [
          { title: "Vendors", url: "/dashboard/resident/vendors", icon: <BriefcaseBusinessIcon /> },
          { title: "Tickets", url: "/dashboard/resident/tickets", icon: <CreditCardIcon /> },
          { title: "Recurring", url: "/dashboard/resident/recurring", icon: <RepeatIcon /> },
          { title: "Inspections", url: "/dashboard/resident/inspections", icon: <FileChartColumnIcon /> },
        ],
      },
    ].map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item, isActive: pathname === item.url })),
    })),
    navSecondary: [
      { title: "Settings", url: "/dashboard/resident/settings", icon: <Settings2Icon />, isActive: pathname === "/dashboard/resident/settings" },
    ],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: user } = useMeQuery()
  const { mutate: logout, isPending } = useLogoutMutation()
  const nav = buildNav(user?.role, pathname)
  const displayName = user?.fullName ?? "Property User"
  const displayEmail = user?.email ?? "account@local"
  const displayRole = user?.role?.replaceAll("_", " ") ?? ""

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href={nav.navMain[0]?.items[0]?.url ?? "/dashboard"}>
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">{nav.brand}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={nav.navMain} />
        {nav.navSecondary.length ? (
          <NavSecondary items={nav.navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: displayEmail,
            avatar: "",
            role: displayRole,
          }}
          onLogout={() => logout()}
          isLoggingOut={isPending}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
