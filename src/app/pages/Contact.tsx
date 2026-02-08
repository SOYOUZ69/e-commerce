export const Contact = () => {
  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl text-[#2C2520] mb-4">Contactez-nous</h1>
        <p className="text-[#6B5D52] mb-6">
          Une question sur une commande ou un produit ? Notre équipe répond sous 24h.
        </p>
        <div className="bg-white p-8 rounded-2xl text-left space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#B8936A]">Email</p>
            <p className="text-[#2C2520]">bonjour@refletdart.com</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-[#B8936A]">Téléphone</p>
            <p className="text-[#2C2520]">+33 1 84 88 00 11</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-[#B8936A]">Adresse</p>
            <p className="text-[#2C2520]">12 rue des Arts, 75003 Paris</p>
          </div>
        </div>
      </div>
    </section>
  );
};
