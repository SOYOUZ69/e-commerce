import { useEffect, useState } from 'react';
import { Truck, Shield, RefreshCw, Headphones, Sparkles, Package } from 'lucide-react';
import { fetchJson } from '../api/client';

export function Features() {
  const [features, setFeatures] = useState<
    { title: string; description: string; iconKey?: string | null }[]
  >([]);

  const defaults = [
    {
      title: "Free Shipping",
      description: "On orders over $100"
    },
    {
      title: "Secure Payment",
      description: "100% secure transactions"
    },
    {
      title: "Easy Returns",
      description: "30-day return policy"
    },
    {
      title: "24/7 Support",
      description: "Dedicated customer service"
    }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchJson('/api/home/features');
        setFeatures(items.length ? items : defaults);
      } catch {
        setFeatures(defaults);
      }
    };
    load();
  }, []);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    truck: Truck,
    shield: Shield,
    refresh: RefreshCw,
    support: Headphones,
    sparkles: Sparkles,
    package: Package,
  };

  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = iconMap[(feature.iconKey ?? '').toLowerCase()] ?? Truck;
            return (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="bg-[#FAF8F3] p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-[#B8936A]" />
              </div>
              <h3 className="text-[#2C2520] mb-2">{feature.title}</h3>
              <p className="text-[#6B5D52] text-sm">{feature.description}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
