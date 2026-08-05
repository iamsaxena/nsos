import { EventPlatform } from "../EventPlatform";

export const metadata = {
  title: "NSOS Admin Panel",
  description: "Restricted administration workspace for Namahmi School of Skills.",
  robots: { index: false, follow: false },
};

export default function AdminPanelPage() { return <EventPlatform initialView="admin" />; }
