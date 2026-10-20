import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  Settings,
  User,
  Users,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean; exact?: boolean };

export const residentNav: NavItem[] = [
  { href: "/resident/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/resident/complaints", label: "My Complaints", icon: ClipboardList, mobile: true, exact: true },
  { href: "/resident/complaints/new", label: "Raise Complaint", icon: PlusCircle, mobile: true },
  { href: "/resident/history", label: "History", icon: History },
  { href: "/resident/announcements", label: "Announcements", icon: Megaphone },
  { href: "/resident/notifications", label: "Notifications", icon: Bell, mobile: true },
  { href: "/resident/profile", label: "Profile", icon: User },
];

export const managerNav: NavItem[] = [
  { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/manager/complaints", label: "Complaints", icon: ClipboardList, mobile: true },
  { href: "/manager/analytics", label: "Analytics", icon: BarChart3, mobile: true },
  { href: "/manager/residents", label: "Residents", icon: Users },
  { href: "/manager/announcements", label: "Announcements", icon: Megaphone },
  { href: "/manager/notifications", label: "Notifications", icon: Bell, mobile: true },
  { href: "/manager/settings", label: "Settings", icon: Settings },
];
