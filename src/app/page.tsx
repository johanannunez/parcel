import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import SocialProofStrip from "@/components/home/SocialProofStrip";
import ManagementTeaser from "@/components/home/ManagementTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProperties />
      <SocialProofStrip />
      <ManagementTeaser />
    </>
  );
}
