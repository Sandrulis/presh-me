import { IntentLanding } from "@/app/components/intent-landing";
import { intentMetadata } from "@/app/lib/seo/intent-page";

export const metadata = intentMetadata({
  path: "/for/barbers",
  title: "Link in bio for barbers",
  description:
    "Booking, Instagram and shop links on one Presh.Me page — a practical digital card for barbers.",
});

export default function Page() {
  return (
    <IntentLanding
      path="/for/barbers"
      kicker="Barbers"
      h1="Booking and socials in one shop link"
      lead="Clients should not hunt through stories for your booking URL. One page holds booking, price list, Instagram and location."
      bullets={[
        "Buttons for booking apps, WhatsApp or phone.",
        "Photo and text blocks for services and hours.",
        "Share as a bio link or QR at the chair.",
      ]}
      related={[
        { href: "/digital-business-card", label: "Digital business card" },
        { href: "/for/beauty-professionals", label: "Beauty professionals" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
