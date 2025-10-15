import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Reports() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, period, category]);

  const fetchTransactions = async () => {
    const now = new Date();
    let startDate;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setTransactions(data || []);

    const uniqueCategories = [...new Set(data?.map((t) => t.category) || [])];
    setCategories(uniqueCategories);
  };

  const getCategorySpending = () => {
    const spending = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        spending[t.category] = (spending[t.category] || 0) + parseFloat(t.amount);
      }
    });

    return {
      labels: Object.keys(spending),
      datasets: [
        {
          label: 'Spending',
          data: Object.values(spending),
          backgroundColor: '#9c27b0',
        },
      ],
    };
  };

  const downloadSummary = () => {
    const summary = {
      period,
      category: category === 'all' ? 'All Categories' : category,
      totalTransactions: transactions.length,
      totalIncome: transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpense: transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    };

    const text = `
Financial Report
================
Period: ${summary.period}
Category: ${summary.category}
Total Transactions: ${summary.totalTransactions}
Total Income: ₹${summary.totalIncome.toFixed(2)}
Total Expense: ₹${summary.totalExpense.toFixed(2)}
Net: ₹${(summary.totalIncome - summary.totalExpense).toFixed(2)}
================
Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${Date.now()}.txt`;
    a.click();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a0a0a0',
        },
      },
    },
    scales: {
      y: {
        ticks: { color: '#a0a0a0' },
        grid: { color: '#3a3a3a' },
      },
      x: {
        ticks: { color: '#a0a0a0' },
        grid: { color: '#3a3a3a' },
      },
    },
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Reports</h1>

        <div className="reports-filters">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Period</label>
              <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-download" onClick={downloadSummary}>
            Download Summary
          </button>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Category-wise Spending</h3>
          <div style={{ height: '400px' }}>
            {transactions.some((t) => t.type === 'expense') ? (
              <Bar data={getCategorySpending()} options={chartOptions} />
            ) : (
              <div className="empty-state">No expense data available for the selected filters</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
