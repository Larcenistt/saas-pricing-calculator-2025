import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import useCalculationStore from '../stores/calculationStore';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const { 
    calculations, 
    fetchCalculations, 
    deleteCalculation,
    shareCalculation,
    isLoading 
  } = useCalculationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch user data and calculations
    fetchProfile();
    fetchCalculations();
  }, [isAuthenticated, navigate]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name || 'this calculation'}"?`)) {
      await deleteCalculation(id);
    }
  };

  const handleShare = async (id) => {
    await shareCalculation(id);
  };

  const filteredCalculations = calculations.filter(calc => 
    calc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Welcome back, {user?.name || 'there'}!
              </h1>
              <p className="text-muted">
                Manage your pricing calculations and optimize your strategy
              </p>
            </div>
            <Link
              to="/calculator"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Calculation
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted">Total Calculations</span>
              <svg className="w-8 h-8 text-primary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold">{calculations.length}</div>
            <div className="text-sm text-green-500 mt-1">+2 this week</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted">Shared</span>
              <svg className="w-8 h-8 text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
            </div>
            <div className="text-3xl font-bold">
              {calculations.filter(c => c.isPublic).length}
            </div>
            <div className="text-sm text-muted mt-1">Public calculations</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted">Current Plan</span>
              <svg className="w-8 h-8 text-accent opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold capitalize">
              {user?.subscription?.plan || 'Free'}
            </div>
            {user?.subscription?.plan === 'FREE' && (
              <Link to="/pricing" className="text-sm text-primary mt-1 hover:underline">
                Upgrade for more
              </Link>
            )}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted">Usage</span>
              <svg className="w-8 h-8 text-warning opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-3xl font-bold">
              {user?.subscription?.calculationsUsed || 0}/{user?.subscription?.calculationsLimit || 3}
            </div>
            <div className="text-sm text-muted mt-1">This month</div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search calculations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary text-white' 
                  : 'bg-white/5 text-muted hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary text-white' 
                  : 'bg-white/5 text-muted hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Calculations Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredCalculations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <svg className="w-24 h-24 mx-auto mb-4 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No calculations yet</h3>
            <p className="text-muted mb-6">Create your first pricing calculation to get started</p>
            <Link
              to="/calculator"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Calculation
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
          >
            {filteredCalculations.map((calc) => (
              <motion.div
                key={calc.id}
                variants={itemVariants}
                className={`glass-card p-6 hover:border-primary/30 transition-all group ${
                  viewMode === 'list' ? 'flex items-center justify-between' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {calc.name || 'Untitled Calculation'}
                        </h3>
                        <p className="text-sm text-muted">
                          {new Date(calc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {calc.isPublic && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                          Shared
                        </span>
                      )}
                    </div>

                    {calc.notes && (
                      <p className="text-sm text-muted mb-4 line-clamp-2">{calc.notes}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted">Current Price</span>
                        <div className="font-semibold">${calc.inputs?.currentPrice || 0}</div>
                      </div>
                      <div>
                        <span className="text-muted">Customers</span>
                        <div className="font-semibold">{calc.inputs?.currentCustomers || 0}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/calculator?id=${calc.id}`}
                        className="flex-1 py-2 px-3 bg-primary/10 text-primary text-center rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleShare(calc.id)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(calc.id, calc.name)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{calc.name || 'Untitled Calculation'}</h3>
                        <p className="text-sm text-muted">
                          Created {new Date(calc.createdAt).toLocaleDateString()} • 
                          ${calc.inputs?.currentPrice || 0} • 
                          {calc.inputs?.currentCustomers || 0} customers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {calc.isPublic && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                          Shared
                        </span>
                      )}
                      <Link
                        to={`/calculator?id=${calc.id}`}
                        className="py-2 px-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleShare(calc.id)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(calc.id, calc.name)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}