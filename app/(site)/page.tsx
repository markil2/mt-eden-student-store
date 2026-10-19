import { Hero } from "@/components/site/hero";
import { CategoryGrid } from "@/components/site/category-grid";
import { PopularItems } from "@/components/site/popular-items";
import { HowItWorks } from "@/components/site/how-it-works";
import { StoryBand } from "@/components/site/story-band";
import { CafeInfo } from "@/components/site/cafe-info";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <PopularItems />
      <StoryBand />
      <HowItWorks />
      <CafeInfo />
    </>
  );
}
