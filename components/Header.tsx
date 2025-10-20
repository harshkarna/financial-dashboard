'use client'

import { User } from 'next-auth'
import { LogOut, TrendingUp } from 'lucide-react'

interface HeaderProps {
  user: User | undefined
  onSignOut: () => void
}

export function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-white to-blue-50 shadow-lg border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Net Worth Tracker
              </h1>
              <p className="text-xs text-gray-500">Personal Finance Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white rounded-full px-4 py-2 border border-gray-100 shadow-sm">
              {user?.image && (
                <img
                  src={user.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full ring-2 ring-blue-100"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{user?.name}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
            
            <button
              onClick={onSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-red-500 bg-white border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}