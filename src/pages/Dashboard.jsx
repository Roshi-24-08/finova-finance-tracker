import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('monthly');
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
  }, [user, filter]);

  const fetchTransactions = async () => {
    const now = new Date();
    let startDate;

    if (filter === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    setTransactions(data || []);
  };

  const calculateSummary = () => {
    const summary = {
      income: 0,
      expense: 0,
      savings: 0,
      investment: 0,
      lent: 0,
      borrowed: 0,
    };

    transactions.forEach((t) => {
      summary[t.type] += parseFloat(t.amount);
    });

    return summary;
  };

  const getCategoryData = () => {
    const categories = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
      }
    });

    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: [
            '#ff1744',
            '#9c27b0',
            '#ff6b35',
            '#00bfa5',
            '#00e676',
            '#ff9800',
          ],
        },
      ],
    };
  };

  const getTrendData = () => {
    const months = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
      if (!months[month]) {
        months[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        months[month].income += parseFloat(t.amount);
      } else if (t.type === 'expense') {
        months[month].expense += parseFloat(t.amount);
      }
    });

    return {
      labels: Object.keys(months),
      datasets: [
        {
          label: 'Income',
          data: Object.values(months).map((m) => m.income),
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Expense',
          data: Object.values(months).map((m) => m.expense),
          borderColor: '#ff1744',
          backgroundColor: 'rgba(255, 23, 68, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const summary = calculateSummary();

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
        <h1 className="page-title">Dashboard</h1>

        <div className="filter-buttons">
          <button
            className={`btn-filter ${filter === 'monthly' ? 'active' : ''}`}
            onClick={() => setFilter('monthly')}
          >
            Monthly
          </button>
          <button
            className={`btn-filter ${filter === 'quarterly' ? 'active' : ''}`}
            onClick={() => setFilter('quarterly')}
          >
            Quarterly
          </button>
          <button
            className={`btn-filter ${filter === 'yearly' ? 'active' : ''}`}
            onClick={() => setFilter('yearly')}
          >
            Yearly
          </button>
        </div>

        <div className="summary-cards">
          <div className="summary-card income">
            <div className="summary-label">Total Income</div>
            <div className="summary-value">₹{summary.income.toFixed(2)}</div>
          </div>
          <div className="summary-card expense">
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value">₹{summary.expense.toFixed(2)}</div>
          </div>
          <div className="summary-card savings">
            <div className="summary-label">Savings</div>
            <div className="summary-value">₹{summary.savings.toFixed(2)}</div>
          </div>
          <div className="summary-card investment">
            <div className="summary-label">Investments</div>
            <div className="summary-value">₹{summary.investment.toFixed(2)}</div>
          </div>
          <div className="summary-card lent">
            <div className="summary-label">Lent</div>
            <div className="summary-value">₹{summary.lent.toFixed(2)}</div>
          </div>
          <div className="summary-card borrowed">
            <div className="summary-label">Borrowed</div>
            <div className="summary-value">₹{summary.borrowed.toFixed(2)}</div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card">
            <h3 className="chart-title">Category-wise Spending</h3>
            <div style={{ height: '300px' }}>
              {transactions.some((t) => t.type === 'expense') ? (
                <Pie data={getCategoryData()} options={{ ...chartOptions, scales: undefined }} />
              ) : (
                <div className="empty-state">No expense data available</div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Income vs Expense Trend</h3>
            <div style={{ height: '300px' }}>
              {transactions.length > 0 ? (
                <Line data={getTrendData()} options={chartOptions} />
              ) : (
                <div className="empty-state">No transaction data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
