import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Gift,
  Handshake,
  MessageSquare,
  Repeat2,
  Zap,
} from "lucide-react";
import { buttonClasses, cardClasses } from "@/components/ui";

const FEATURES = [
  {
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
    title: "Urgent priority boost",
    desc: "Mark a request urgent and jump the queue with providers.",
  },
  {
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
    title: "Smart compatibility check",
    desc: "We check capacity, quantity and amenities — not just availability.",
  },
  {
    icon: Clock,
    color: "bg-slate-100 text-slate-600",
    title: "Minimum rental filtering",
    desc: "Listings that don't fit your booking window are filtered out automatically.",
  },
  {
    icon: Gift,
    color: "bg-orange-50 text-orange-600",
    title: "Bundled requests",
    desc: "Need a hall, parking and AV together? Match a whole event bundle across providers.",
  },
  {
    icon: CircleDollarSign,
    color: "bg-yellow-50 text-yellow-600",
    title: "Price transparency",
    desc: "See the going rate for similar resources before you list or book.",
  },
  {
    icon: Activity,
    color: "bg-lime-50 text-lime-600",
    title: "Idle asset alerts",
    desc: "Providers get nudged when a resource has been sitting unused.",
  },
  {
    icon: Handshake,
    color: "bg-teal-50 text-teal-600",
    title: "Two-way trust score",
    desc: "Both sides rate each other after every transaction.",
  },
  {
    icon: Repeat2,
    color: "bg-stone-100 text-stone-600",
    title: "Alternatives on rejection",
    desc: "Rejected? We instantly suggest similar available providers.",
  },
  {
    icon: MessageSquare,
    color: "bg-gray-100 text-gray-600",
    title: "Transparent negotiation",
    desc: "Every quote, counter-offer and response is timestamped in one thread.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="relative bg-glow text-center py-12 space-y-6 -mt-6">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 text-balance">
          Share what&apos;s idle.
          <br />
          <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-500 bg-clip-text text-transparent">
            Book what you need.
          </span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          A B2B marketplace where hotels, restaurants, caterers, venues, resorts and event
          organizers discover, share and book banquet space, parking, vehicles, kitchen
          capacity, furniture and AV equipment from each other.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/signup" className={buttonClasses("primary")}>
            Create a business account
          </Link>
          <Link href="/resources" className={buttonClasses("secondary")}>
            Browse resources
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className={`${cardClasses(true)} p-5`}>
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${f.color}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </span>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
