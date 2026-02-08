import { Link, useSearchParams } from 'react-router-dom';

export const OrderConfirmed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl text-[#2C2520] mb-4">Commande confirmée</h1>
        <p className="text-[#6B5D52] mb-6">
          Merci pour votre commande. Nous la traitons dès que possible.
        </p>
        {orderId && (
          <p className="text-sm text-[#6B5D52] mb-6">
            Numéro de commande: <span className="text-[#2C2520]">{orderId}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={orderId ? `/account/orders/${orderId}` : '/account/orders'}
            className="bg-[#2C2520] text-white px-6 py-3 hover:bg-[#B8936A] transition-colors"
          >
            Voir la commande
          </Link>
          <Link
            to="/products"
            className="border border-[#B8936A] text-[#B8936A] px-6 py-3 hover:bg-[#B8936A] hover:text-white transition-colors"
          >
            Continuer les achats
          </Link>
        </div>
      </div>
    </section>
  );
};
