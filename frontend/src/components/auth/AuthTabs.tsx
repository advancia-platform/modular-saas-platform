"use client";

import React from "react";
import { LogIn, UserPlus } from "lucide-react";

interface Tab {
  id: "login" | "register";
  label: string;
  icon: string;
  description: string;
}

interface AuthTabsProps {
  activeTab: "login" | "register";
  onTabChange: (tabId: "login" | "register") => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    {
      id: "login",
      label: "Sign In",
      icon: "LogIn",
      description: "Access your account",
    },
    {
      id: "register",
      label: "Sign Up",
      icon: "UserPlus",
      description: "Create new account",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            {tab.id === "login" ? (
              <LogIn size={20} className="text-gray-400" />
            ) : (
              <UserPlus size={20} className="text-gray-400" />
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {activeTab === "login" ? "Welcome Back" : "Join Advancia Pay"}
        </h2>
        <p className="text-gray-600">
          {activeTab === "login"
            ? "Sign in to access your wallet and dashboard"
            : "Create your account to start managing your finances"}
        </p>
      </div>
    </div>
  );
};

export default AuthTabs;
