import { useEffect, useState } from 'react';
import { adminGet } from '../api/admin';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    const load = async () => {
      const [products, categories] = await Promise.all([
        adminGet('/api/admin/products'),
        adminGet('/api/admin/categories'),
      ]);
      setSummary({ products: products.length, categories: categories.length });
    };
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-[#6B5D52]">Produits</p>
        <p className="text-3xl text-[#2C2520]">{summary.products}</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-[#6B5D52]">Categories</p>
        <p className="text-3xl text-[#2C2520]">{summary.categories}</p>
      </div>
    </div>
  );
};
