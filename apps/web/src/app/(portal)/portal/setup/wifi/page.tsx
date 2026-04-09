import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { WifiForm } from "./WifiForm";

export const metadata: Metadata = { title: "Wi-Fi and Tech" };

export default function WifiPage() {
  return (
    <StepShell
      track="property"
      stepNumber={7}
      title="Wi-Fi and tech"
      whyWeAsk="Guests expect reliable internet. We print a Wi-Fi card for the property and need billing access to troubleshoot outages."
      estimateMinutes={3}
    >
      <WifiForm />
    </StepShell>
  );
}
