"use client";

import { usePathname } from "next/navigation";
import { Home, ChefHat, CalendarDays, ShoppingCart, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",           label: "Início",    Icon: Home         },
  { href: "/agente",     label: "Agente",    Icon: ChefHat      },
  { href: "/planejador", label: "Cardápio",  Icon: CalendarDays },
  { href: "/lista",      label: "Lista",     Icon: ShoppingCart },
  { href: "/favoritos",  label: "Favoritos", Icon: Heart        },
  { href: "/perfil",     label: "Perfil",    Icon: User         },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-bottom">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <a
            key={href}
            href={href}
            className={`nav-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
