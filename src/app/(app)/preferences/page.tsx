import type { Metadata } from "next";

import { PreferencesPage } from "@/components/preferences/preferences-page";

export const metadata: Metadata = { title: "Preferences" };

export default function Page() {
  return <PreferencesPage />;
}
