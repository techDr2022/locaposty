import { Metadata } from "next";
import ConnectGMBClient from "@/components/settings/locations/ConnectGMBClient";

export const metadata: Metadata = {
  title: "Connect Google Business Profile | LocaPosty",
  description: "Connect your Google Business Profiles to LocaPosty",
};

export default function ConnectGMBPage() {
  return <ConnectGMBClient />;
}
