import { Container } from "@/components/ui/container";
import { valueItems, valueSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

export function ValueSection() {
  return (
    <section id={SECTION_IDS.value} className="bg-[#e7efea] py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Cara kerja</p>
          <h2 className="max-w-3xl font-display text-section font-medium text-balance text-ink">
            {valueSection.heading}
          </h2>
        </div>

        <ol className="relative mt-14 grid gap-0 md:grid-cols-3 md:before:absolute md:before:top-5 md:before:right-[16%] md:before:left-[16%] md:before:h-px md:before:bg-line-strong">
          {valueItems.map((item, index) => (
            <li key={item.marker} className="relative grid grid-cols-[2.5rem_1fr] gap-5 border-l border-line-strong pb-12 pl-6 last:pb-0 md:block md:border-0 md:pb-0 md:pl-0 md:pr-10">
              <span className="absolute top-0 -left-[5px] h-2.5 w-2.5 rounded-full bg-forest md:relative md:left-0 md:z-10 md:flex md:h-10 md:w-10 md:items-center md:justify-center md:bg-forest md:text-xs md:font-semibold md:text-white">
                <span className="hidden md:inline">{item.marker}</span>
              </span>
              <span className="font-display text-lg text-accent md:hidden">{item.marker}</span>
              <div className="md:mt-6">
                <h3 className="text-xl font-semibold text-ink sm:text-2xl">{item.title}</h3>
                <p className="mt-3 max-w-sm leading-7 text-muted">{item.body}</p>
                <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Tahap {index + 1}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
