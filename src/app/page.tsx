import Link from "next/link";
import { RESOURCE_TYPE_STYLES } from "@/lib/utils";

const FEATURE_COLORS = Object.values(RESOURCE_TYPE_STYLES);

const FEATURES = [
  { icon: "⚡", title: "Urgent priority boost", desc: "Mark a request urgent and jump the queue with providers." },
  { icon: "✅", title: "Smart compatibility check", desc: "We check capacity, quantity and amenities — not just availability." },
  { icon: "⏱️", title: "Minimum rental filtering", desc: "Listings that don't fit your booking window are filtered out automatically." },
  { icon: "🎁", title: "Bundled requests", desc: "Need a hall, parking and AV together? Match a whole event bundle across providers." },
  { icon: "💰", title: "Price transparency", desc: "See the going rate for similar resources before you list or book." },
  { icon: "📊", title: "Idle asset alerts", desc: "Providers get nudged when a resource has been sitting unused." },
  { icon: "🤝", title: "Two-way trust score", desc: "Both sides rate each other after every transaction." },
  { icon: "🔁", title: "Alternatives on rejection", desc: "Rejected? We instantly suggest similar available providers." },
  { icon: "💬", title: "Transparent negotiation", desc: "Every quote, counter-offer and response is timestamped in one thread." },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="text-center py-8 space-y-6">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 text-balance">
          Share what&apos;s idle.
          <br />
          Book what you need.
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          A B2B marketplace where hotels, restaurants, caterers, venues, resorts and event
          organizers discover, share and book banquet space, parking, vehicles, kitchen
          capacity, furniture and AV equipment from each other.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            Create a business account
          </Link>
          <Link
            href="/resources"
            className="border border-gray-300 px-6 py-3 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Browse resources
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => {
          const color = FEATURE_COLORS[i % FEATURE_COLORS.length];
          return (
            <div
              key={f.title}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors"
            >
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-base mb-3 ${color.iconBg}`}
              >
                {f.icon}
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
