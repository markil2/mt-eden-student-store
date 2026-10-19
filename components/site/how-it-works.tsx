import { Reveal } from "@/components/ui/reveal";

const steps = [
  { title: "Choose your favorites", body: "Browse the menu and customize your sandwich, bagel or drink." },
  { title: "Pickup or delivery", body: "Grab it at the store, or have it brought to your classroom when delivery is open." },
  { title: "Pay and enjoy", body: "Check out in a few taps. We'll have it ready in your window." },
];

export function HowItWorks() {
  return (
    <section className="bg-navy py-20 text-cream md:py-28" aria-labelledby="how-title">
      <div className="container-page">
        <Reveal className="max-w-xl">
          <p className="eyebrow text-gold">How it works</p>
          <h2 id="how-title" className="mt-3 font-display text-4xl md:text-5xl">
            Order before the bell.
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="border-t border-cream/20 pt-6">
              <span className="font-display text-6xl leading-none text-gold italic md:text-7xl">{i + 1}</span>
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-cream/70">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
