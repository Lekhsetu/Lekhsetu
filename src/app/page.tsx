import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WriterMarquee from "@/components/WriterMarquee";
import FeaturedStories from "@/components/FeaturedStories";
import Categories from "@/components/Categories";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WriterMarquee />
      <FeaturedStories />
      <Categories />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
