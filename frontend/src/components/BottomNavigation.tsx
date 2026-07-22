import { NavLink, useLocation } from "react-router-dom";
import "./BottomNavigation.css";
import { Icons } from "@/components/materials";

export default function BottomNavigation() {

  const location = useLocation();

  const isDataActive =
    location.pathname === "/data" ||
    location.pathname === "/calendar";

  const isCompareActive =
    location.pathname === "/compare" ||
    location.pathname === "/compare-setting";

  return (
    <nav className="bottom-navigation">

      <NavLink
        to="/data"
        className={isDataActive ? "nav-item active" : "nav-item"}
      >
        <Icons.Newspaper size={40} />
      </NavLink>

      <NavLink
        to="/graph"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <Icons.ChartLine size={40} />
      </NavLink>

      <NavLink
        to="/compare"
        className={isCompareActive ? "nav-item active" : "nav-item"}
      >
        <Icons.ChartNoAxesCombined size={40} />
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <Icons.Settings size={40} />
      </NavLink>

    </nav>
  );
}