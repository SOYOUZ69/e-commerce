export const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-2xl p-6 shadow-sm">
    <h2 className="text-2xl text-[#2C2520] mb-4">{title}</h2>
    {children}
  </section>
);
