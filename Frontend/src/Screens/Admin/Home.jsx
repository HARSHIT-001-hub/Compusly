/**
 * Frontend/src/Screens/Admin/Home.jsx  (updated)
 *
 * Changes from original:
 *  1. Import AIDashboard component
 *  2. Add "AI Dashboard" item to MENU_ITEMS
 *
 * Everything else is identical to the original file.
 */

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { toast, Toaster } from "react-hot-toast";
import Notice from "../Notice";
import Student from "./Student";
import Faculty from "./Faculty";
import Subjects from "./Subject";
import Admin from "./Admin";
import Branch from "./Branch";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import Profile from "./Profile";
import Exam from "../Exam";
import AIDashboard from "./AIDashboard";   // ← NEW
import { useNavigate, useLocation } from "react-router-dom";
import ChatWidget from "../../components/ChatWidget";


const MENU_ITEMS = [
  { id: "home",         label: "Home",          component: Profile      },
  { id: "student",      label: "Student",        component: Student      },
  { id: "faculty",      label: "Faculty",        component: Faculty      },
  { id: "branch",       label: "Branch",         component: Branch       },
  { id: "notice",       label: "Notice",         component: Notice       },
  { id: "exam",         label: "Exam",           component: Exam         },
  { id: "subjects",     label: "Subjects",       component: Subjects     },
  { id: "admin",        label: "Admin",          component: Admin        },
  { id: "ai-dashboard", label: "🤖 AI Dashboard", component: AIDashboard }, // ← NEW
];

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData]   = useState();
  const [isLoading,   setIsLoading]     = useState(false);
  const dispatch   = useDispatch();
  const userToken  = localStorage.getItem("userToken");

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      toast.loading("Loading user details...");
      const response = await axiosWrapper.get(`/admin/my-details`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.data.success) {
        setProfileData(response.data.data);
        dispatch(setUserData(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching user details");
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => { fetchUserDetails(); }, [dispatch, userToken]);

  useEffect(() => {
    const urlParams  = new URLSearchParams(location.search);
    const pathMenuId = urlParams.get("page") || "home";
    const validMenu  = MENU_ITEMS.find(item => item.id === pathMenuId);
    setSelectedMenu(validMenu ? validMenu.id : "home");
  }, [location.pathname]);

  const getMenuItemClass = (menuId) => {
    const isSelected = selectedMenu === menuId;
    return `
      text-center px-6 py-3 cursor-pointer
      font-medium text-sm w-full rounded-md
      transition-all duration-300 ease-in-out
      ${isSelected
        ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg transform -translate-y-1"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
      }
    `;
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64">Loading...</div>;
    }
    if (selectedMenu === "home" && profileData) {
      return <Profile profileData={profileData} />;
    }
    const MenuItem = MENU_ITEMS.find(item => item.id === selectedMenu)?.component;
    return MenuItem && <MenuItem />;
  };

  const handleMenuClick = (menuId) => {
    setSelectedMenu(menuId);
    navigate(`/admin?page=${menuId}`);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="w-full overflow-x-auto my-6">
          <ul className="flex items-center gap-4 min-w-max px-4">
          {MENU_ITEMS.map(item => (
            <li
              key={item.id}
              className={getMenuItemClass(item.id)}
              onClick={() => handleMenuClick(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        {renderContent()}
        </div>
      </div>
      <Toaster position="bottom-center" />
            <ChatWidget />
    </>
  );
};

export default Home;
