import { useState } from "react";
import { FaBars, FaTimes, FaHome, FaUser, FaCog } from "react-icons/fa";
import { SiGooglemessages } from "react-icons/si";
import { RiUserCommunityFill } from "react-icons/ri";
import { LuListTodo } from "react-icons/lu";
import { Link } from "react-router-dom";

function Offcanvas() {
    const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className={`d-flex flex-column bg-dark p-3 vh-100 ${
          isCollapsed ? "collapsed-sidebar" : "sidebar"
        }`}
        style={{ width: isCollapsed ? "80px" : "250px", transition: "0.3s" }}
      >
        <button
          className="btn btn-outline-light mb-3"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <FaBars />
        </button>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link to="messages" className="nav-link text-white d-flex align-items-center">
              <SiGooglemessages className="me-2" />
              {!isCollapsed && "Messages"}
            </Link>
          </li>
          <li className="nav-item">
            <Link to="communities" className="nav-link text-white d-flex align-items-center">
              <RiUserCommunityFill className="me-2" />
              {!isCollapsed && "Communities"}
            </Link>
          </li>
          <li className="nav-item">
            <Link to="todolist" className="nav-link text-white d-flex align-items-center">
              <LuListTodo className="me-2" />
              {!isCollapsed && "TodoList"}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Offcanvas;
