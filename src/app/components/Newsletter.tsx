import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { fetchJson } from '../api/client';

type Settings = {
  newsletterText?: string | null;
  newsletterEnabled?: boolean;
};

export function Newsletter() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJson('/api/settings');
        setSettings(data ?? {});
      } catch {
        setSettings({});
      }
    };
    load();
  }, []);

  if (settings.newsletterEnabled === false) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-[#B8936A] to-[#A67C52]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl text-white mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            {settings.newsletterText ??
              'Get exclusive offers, new arrivals, and insider-only deals delivered straight to your inbox'}
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="bg-white text-[#B8936A] px-8 py-4 rounded-lg hover:bg-[#2C2520] hover:text-white transition-colors whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>
          
          <p className="text-white/70 text-sm mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates
          </p>
        </div>
      </div>
    </section>
  );
}
