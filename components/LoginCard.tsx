'use client'

import { LogIn, TrendingUp, Shield, BarChart3, DollarSign, PieChart, Calculator } from 'lucide-react'

interface LoginCardProps {
  onSignIn: () => void
}

export function LoginCard({ onSignIn }: LoginCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        {/* Centered content */}
        <div className="flex flex-col lg:flex-row items-center gap-16 px-8 lg:px-16 max-w-6xl mx-auto">
          {/* Left side - Hero content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            {/* Logo and title */}
            <div>
              <div className="inline-flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Financial Dashboard
                </h1>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                Transform your Google Sheets into a powerful financial tracking dashboard
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Net Worth Tracking & Trends</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <PieChart className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Monthly Budget Analysis</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <Calculator className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300">Earnings Breakdown & Insights</span>
              </div>
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">Secure Google Sheets Integration</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-sm text-gray-400">Dashboards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Free</div>
                <div className="text-sm text-gray-400">To Use</div>
              </div>
            </div>
          </div>

          {/* Right side - Login card */}
          <div className="flex-shrink-0">
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Get Started
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Connect your Google account to access your financial data
                  </p>
                </div>

                <button
                  onClick={onSignIn}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                </button>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-400">
                    By signing in, you agree to secure access to your Google Sheets data.
                    <br />
                    <span className="text-green-400">✓ No data stored</span> · <span className="text-green-400">✓ Read-only access</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}