import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl text-[#2C2520] mb-4">Page introuvable</h1>
        <p className="text-[#6B5D52] mb-6">
          Cette page n'existe pas. Retournez à la boutique pour poursuivre vos achats.
        </p>
        <Link
          to="/"
          className="inline-block bg-[#B8936A] text-white px-6 py-3 hover:bg-[#2C2520] transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </section>
  );
};
