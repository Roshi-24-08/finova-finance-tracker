import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '@/integrations/supabase/client';

export default function Transactions() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    amount: '',
    mode: '',
    description: '',
    counterparty: '',
  });
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
  }, [user]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    setTransactions(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await supabase
        .from('transactions')
        .update(formData)
        .eq('id', editingId);
    } else {
      await supabase.from('transactions').insert([
        {
          ...formData,
          user_id: user.id,
        },
      ]);
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: '',
      amount: '',
      mode: '',
      description: '',
      counterparty: '',
    });
    setShowForm(false);
    setEditingId(null);
    fetchTransactions();
  };

  const handleEdit = (transaction) => {
    setFormData({
      date: transaction.date,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      mode: transaction.mode || '',
      description: transaction.description || '',
      counterparty: transaction.counterparty || '',
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchTransactions();
    }
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container">
        <div className="transactions-header">
          <h1 className="page-title">Transactions</h1>
          <button
            className="btn-add"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: '',
                amount: '',
                mode: '',
                description: '',
                counterparty: '',
              });
            }}
          >
            {showForm ? 'Cancel' : 'Add Transaction'}
          </button>
        </div>

        {showForm && (
          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="investment">Investment</option>
                  <option value="lent">Lent</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mode</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  placeholder="Cash, Card, UPI, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Counterparty</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.counterparty}
                  onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
                  placeholder="Person/Company"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Add'} Transaction
              </button>
            </div>
          </form>
        )}

        <div className="transactions-table">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Description</th>
                <th>Counterparty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No transactions yet. Add your first transaction!
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{transaction.type}</td>
                    <td>{transaction.category}</td>
                    <td>${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>{transaction.mode || '-'}</td>
                    <td>{transaction.description || '-'}</td>
                    <td>{transaction.counterparty || '-'}</td>
                    <td>
                      <button className="btn-icon" onClick={() => handleEdit(transaction)}>
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
