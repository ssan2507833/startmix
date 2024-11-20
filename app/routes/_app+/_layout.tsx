import { Outlet, Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import {
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";
import { Button } from "#app/components/ui/button";

const NAV_LINKS = [
  { name: "About", to: "/about" },
  { name: "Blog", to: "/blog" },
  { name: "Pricing", to: "/pricing" },
  { name: "Contact", to: "/contact" },
];

let clamp = (number: number, min: number, max: number) =>
  Math.min(Math.max(number, min), max);

function useBoundedScroll(bound: number) {
  let { scrollY } = useScroll();
  let scrollYBounded = useMotionValue(0);
  let scrollYBoundedProgress = useTransform(scrollYBounded, [0, bound], [0, 1]);

  useMotionValueEvent(scrollY, "change", (current) => {
    let previous = scrollY.getPrevious() ?? 0;
    let diff = current - previous;
    let newScrollYBounded = scrollYBounded.get() + diff;

    scrollYBounded.set(clamp(newScrollYBounded, 0, bound));
  });

  return { scrollYBounded, scrollYBoundedProgress };
}

export default function App() {
  let { scrollYBoundedProgress } = useBoundedScroll(1000);
  let scrollYBoundedProgressThrottled = useTransform(
    scrollYBoundedProgress,
    [0, 0.75, 1],
    [0, 0, 1],
  );
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <motion.header
        style={{
          height: useTransform(
            scrollYBoundedProgressThrottled,
            [0, 1],
            [90, 60],
          ),
          backgroundColor: useMotionTemplate`rgb(255 255 255 / ${useTransform(
            scrollYBoundedProgressThrottled,
            [0, 1],
            [1, 0.6],
          )})`,
        }}
        className="fixed flex inset-x-0 h-20 bg-white shadow"
      >
        <motion.nav className="flex container flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
          <Logo
            scrollYBoundedProgressThrottled={scrollYBoundedProgressThrottled}
          />
          <ul className="hidden lg:flex gap-12">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.name}
              </NavLink>
            ))}
          </ul>
          <Button asChild variant="default" size="lg">
            <Link to="/login">Log In</Link>
          </Button>
        </motion.nav>
      </motion.header>
      <div className="flex-1">
        {/* <Outlet /> */}
        {/* Start - test header animation upon scroll down */}
        <main className="px-8 pt-28">
          <h1 className="h-10 w-4/5 rounded bg-slate-200 text-2xl font-bold" />
          <div className="mt-8 space-y-6">
            {[...Array(2).keys()].map((i) => (
              <div key={i} className="space-y-2 text-sm">
                <p className="h-4 w-5/6 rounded bg-slate-200" />
                <p className="h-4 rounded bg-slate-200" />
                <p className="h-4 w-4/6 rounded bg-slate-200" />
              </div>
            ))}
            <div className="h-64 rounded bg-slate-200"></div>
            {[...Array(90).keys()].map((i) => (
              <div key={i} className="space-y-2 text-sm">
                <p className="h-4 w-5/6 rounded bg-slate-200" />
                <p className="h-4 rounded bg-slate-200" />
                <p className="h-4 w-4/6 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </main>
        {/* End - test header animation upon scroll down */}
      </div>
    </div>
  );
}

export function NavLink({
  to,
  ...rest
}: Omit<Parameters<typeof Link>["0"], "to"> & { to: string }) {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <li key={to} className="px-5 py-2">
      <Link
        prefetch="intent"
        className={clsx(
          "underlined block whitespace-nowrap text-lg font-semibold focus:outline-none relative hover:before:scale-x-100 hover:before:origin-left before:w-full before:h-1 before:origin-right before:transition-transform before:duration-300 before:scale-x-0 before:bg-gradient-to-r from-blue-500 to-orange-500 before:absolute before:left-0 before:-bottom-0.5",
          { "text-blue-500": isActive },
        )}
        to={to}
        aria-current={isActive ? "page" : undefined}
        {...rest}
      />
    </li>
  );
}

function Logo({
  scrollYBoundedProgressThrottled,
}: {
  scrollYBoundedProgressThrottled: MotionValue<number>;
}) {
  return (
    <Link to="/" className="">
      <motion.img
        src="/logo.svg"
        alt="Logo"
        className="h-8"
        style={{
          height: useTransform(
            scrollYBoundedProgressThrottled,
            [0, 1],
            [32, 24],
          ),
        }}
      />
    </Link>
  );
}
