import { Hero } from '../components/Hero';
import { CategorySection } from '../components/CategorySection';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { PromoBanners } from '../components/PromoBanners';
import { Features } from '../components/Features';
import { ProductCarousel } from '../components/ProductCarousel';
import { Newsletter } from '../components/Newsletter';

export const Home = () => {
  return (
    <>
      <Hero />
      <Features />
      <CategorySection />
      <FeaturedProducts />
      <PromoBanners />
      <ProductCarousel />
      <Newsletter />
    </>
  );
};
