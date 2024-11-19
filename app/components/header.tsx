import { Link, useLocation } from "@remix-run/react";
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

const navLinks = [
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

export default function Header() {
  let { scrollYBoundedProgress } = useBoundedScroll(400);
  let scrollYBoundedProgressThrottled = useTransform(
    scrollYBoundedProgress,
    [0, 0.75, 1],
    [0, 0, 1],
  );
  return (
    <motion.header
      style={{
        height: useTransform(scrollYBoundedProgressThrottled, [0, 1], [80, 60]),
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
          {navLinks.map((link) => (
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
          "underlined block whitespace-nowrap text-lg font-large focus:outline-none relative hover:before:scale-x-100 hover:before:origin-left before:w-full before:h-1 before:origin-right before:transition-transform before:duration-300 before:scale-x-0 before:bg-blue-500 before:absolute before:left-0 before:-bottom-0.5",
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
