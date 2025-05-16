import { cn } from "@/lib/utils";
import { CircleDollarSign, Dumbbell } from "lucide-react";
import { NavLink } from "react-router";

function MobileLayout({ children }: { children: React.ReactNode }) {
  const buttonCommonClasses = "inline-flex items-center py-2 px-3 rounded-lg hover:bg-primary";

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 mb-[80px]">
      {children}
      <nav className="bg-slate-800 text-white py-3 -mx-4 text-center w-full fixed bottom-0">
        <ul className="flex justify-center gap-4">
          <li>
            <NavLink
              className={({ isActive }) => cn(buttonCommonClasses, { "bg-primary": isActive })}
              to="/expenses"
            >
              <CircleDollarSign className="mr-3" />
              Gastos
            </NavLink>
          </li>
          {/* <li>
            <NavLink
              className={({ isActive }) => cn(buttonCommonClasses, { "bg-primary": isActive })}
              to="/bakery"
            >
              <Utensils className="mr-3" />
              Reposteria
            </NavLink>
          </li> */}
          <li>
            <NavLink
              className={({ isActive }) => cn(buttonCommonClasses, { "bg-primary": isActive })}
              to="/workouts"
            >
              <Dumbbell className="mr-3" />
              Gym
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default MobileLayout;
