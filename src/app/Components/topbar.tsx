"use client";

import React from 'react';
import { FiMenu } from 'react-icons/fi';

type HeaderProps = {
  onMenuClick: () => void;
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <div className="sm:hidden fixed top-0 left-0 right-0 bg-white border-b shadow z-50 flex items-center justify-between px-4 py-3">
      <div className="text-lg font-semibold">Enoylity Dashboard</div>
      <button onClick={onMenuClick} className="text-2xl text-gray-700">
        <FiMenu />
      </button>
    </div>
  );
};

export default Header;
