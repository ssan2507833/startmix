import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";

const navLinks = [
  { name: "About", to: "/about" },
  { name: "Blog", to: "/blog" },
  { name: "Pricing", to: "/pricing" },
  { name: "Contact", to: "/contact" },
];

export default function Navbar() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
      <Logo />
      <div className="hidden max-w-sm flex-1 sm:block">Search bar</div>
      <ul className="hidden lg:flex gap-12">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.name}
          </NavLink>
        ))}
      </ul>
    </nav>
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

function Logo() {
  return (
    <Link to="/" className="">
      <img src="/logo.svg" alt="Logo" className="h-8" />
    </Link>
  );
}
