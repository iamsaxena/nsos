import { EventPlatform } from "../EventPlatform";

export const metadata = {
  title: "NSOS Admin",
  description: "Restricted administration workspace for Namahmi School of Skills.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <EventPlatform initialView="admin" />;
}
