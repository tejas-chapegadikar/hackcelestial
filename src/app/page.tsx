import Link from "next/link";

const FEATURES = [
  { title: "Urgent priority boost", desc: "Mark a request urgent and jump the queue with providers." },
  { title: "Smart compatibility check", desc: "We check capacity, quantity and amenities — not just availability." },
  { title: "Minimum rental filtering", desc: "Listings that don't fit your booking window are filtered out automatically." },
  { title: "Bundled requests", desc: "Need a hall, parking and AV together? Match a whole event bundle across providers." },
  { title: "Price transparency", desc: "See the going rate for similar resources before you list or book." },
  { title: "Idle asset alerts", desc: "Providers get nudged when a resource has been sitting unused." },
  { title: "Two-way trust score", desc: "Both sides rate each other after every transaction." },
  { title: "Alternatives on rejection", desc: "Rejected? We instantly suggest similar available providers." },
  { title: "Transparent negotiation", desc: "Every quote, counter-offer and response is timestamped in one thread." },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center py-12 space-y-5">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
          Share what&apos;s idle. <span className="text-teal-600">Book what you need.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A B2B marketplace where hotels, restaurants, caterers, venues, resorts and event
          organizers discover, share and book banquet space, parking, vehicles, kitchen
          capacity, furniture and AV equipment from each other.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="bg-teal-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-teal-700"
          >
            Create a business account
          </Link>
          <Link
            href="/resources"
            className="border border-gray-300 px-5 py-2.5 rounded-md font-medium text-gray-700 hover:bg-gray-100"
          >
            Browse resources
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
