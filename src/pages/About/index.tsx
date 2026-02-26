export default function AboutUs() {
  return (
    <div className="bg-slate-100  pt-20 text-slate-800">
      <section className="w-full px-4 pb-12">
        <div className="w-full bg-white px-5 py-8 shadow-sm md:px-8">
          <h1 className="text-center text-4xl font-bold text-blue-600 md:text-5xl">
            Who We Are
          </h1>

          <div className="mx-auto mt-8 max-w-4xl space-y-5 text-sm leading-relaxed text-slate-700 md:text-base">
            <div>
              <h2 className="text-sm font-bold text-slate-900 md:text-base">Mission Statement</h2>
              <p className="mt-1.5">
                Our mission is to empower entrepreneurs by offering a simplified, one-stop solution for business planning and formation.
                We strive to make entrepreneurship more accessible and efficient through innovative technology and a personalized experience.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 md:text-base">Vision Statement</h2>
              <p className="mt-1.5">
                We envision a world where starting and growing a business is seamless and accessible to all, fostering innovation and economic growth.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <h3 className="text-lg font-semibold text-slate-900 md:text-xl">Kevin Moore, Founder and CEO</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-[150px_1fr] md:items-start">
              <img
                src="/kevin_profiel.png"
                alt="Kevin Moore"
                className="h-[150px] w-[150px] rounded-full border border-slate-200 object-cover"
              />
              <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                I&apos;ve had numerous business ideas throughout my life. However, I would typically not follow through because I did not know where to begin.
                I realized that was a worthy while problem to solve. For much of my career, I&apos;ve devoted my time to helping others solve complicated problems
                and thought I could apply those same skills to benefit others. I started Founderport to help people achieve their business and financial goals so
                they could avoid the same issues that had previously prevented me from achieving my entrepreneurial goals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}