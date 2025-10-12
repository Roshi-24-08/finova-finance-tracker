import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '@/integrations/supabase/client';

export default function BudgetsGoals() {
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '', period: 'monthly' });
  const [goalForm, setGoalForm] = useState({ name: '', target: '', due_date: '' });
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
      fetchBudgets();
      fetchGoals();
    }
  }, [user]);

  const fetchBudgets = async () => {
    const { data } = await supabase.from('budgets').select('*');
    setBudgets(data || []);
  };

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*');
    setGoals(data || []);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('budgets').insert([{ ...budgetForm, user_id: user.id }]);
    setBudgetForm({ category: '', amount: '', period: 'monthly' });
    fetchBudgets();
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('goals').insert([{ ...goalForm, user_id: user.id }]);
    setGoalForm({ name: '', target: '', due_date: '' });
    fetchGoals();
  };

  const updateGoalProgress = async (goalId, newCurrent) => {
    await supabase.from('goals').update({ current: newCurrent }).eq('id', goalId);
    fetchGoals();
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Budgets & Goals</h1>

        <div className="budgets-goals-container">
          <div className="section-card">
            <h2 className="section-title">Budgets</h2>
            <form onSubmit={handleBudgetSubmit} style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select
                  className="select"
                  value={budgetForm.period}
                  onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Add Budget
              </button>
            </form>

            {budgets.length === 0 ? (
              <div className="empty-state">No budgets set yet</div>
            ) : (
              budgets.map((budget) => (
                <div key={budget.id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{budget.category}</div>
                    <div className="list-item-amount">${parseFloat(budget.amount).toFixed(2)}</div>
                  </div>
                  <div className="progress-text" style={{ textTransform: 'capitalize' }}>
                    {budget.period}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-card">
            <h2 className="section-title">Savings Goals</h2>
            <form onSubmit={handleGoalSubmit} style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Goal Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={goalForm.due_date}
                  onChange={(e) => setGoalForm({ ...goalForm, due_date: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Add Goal
              </button>
            </form>

            {goals.length === 0 ? (
              <div className="empty-state">No goals set yet</div>
            ) : (
              goals.map((goal) => {
                const progress = (parseFloat(goal.current) / parseFloat(goal.target)) * 100;
                return (
                  <div key={goal.id} className="list-item">
                    <div className="list-item-header">
                      <div className="list-item-title">{goal.name}</div>
                      <div className="list-item-amount">${parseFloat(goal.target).toFixed(2)}</div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="progress-text">
                      ${parseFloat(goal.current).toFixed(2)} of ${parseFloat(goal.target).toFixed(2)} (
                      {progress.toFixed(0)}%)
                    </div>
                    <div className="progress-text">Due: {new Date(goal.due_date).toLocaleDateString()}</div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Update Progress</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Add amount"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newCurrent = parseFloat(goal.current) + parseFloat(e.target.value);
                            updateGoalProgress(goal.id, newCurrent);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
