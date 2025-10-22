import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit, Trash2, LogOut, Sun, Moon } from 'lucide-react';
import Chart from 'chart.js/auto';
// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    query
} from 'firebase/firestore';

// --- Firebase Configuration ---
// This is now securely loaded from environment variables
// We add fallback placeholders so the app can load in preview environments.
// Your app will connect to Firebase using your .env.local file (when running 'npm start')
// or your GitHub Secrets (when deployed).
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Helper function for auth errors ---
function getFriendlyErrorMessage(err) {
  let message = "An unexpected error occurred. Please try again.";
  // Use err.code, which is cleaner than err.message
  switch (err.code) {
    case "auth/email-already-in-use":
      message = "This email address is already in use. Please try logging in.";
      break;
    case "auth/invalid-email":
      message = "Please enter a valid email address.";
      break;
    case "auth/weak-password":
      message = "Your password must be at least 6 characters long.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      message = "Invalid email or password. Please try again.";
      break;
    default:
      // You can log the original error to the console for debugging
      console.error("Firebase Auth Error:", err.code, err.message);
      message = "An error occurred. Please try again.";
  }
  return message;
}


const expenseCategories = ['Food', 'Transport', 'Bills', 'Gadgets', 'Entertainment', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Other'];
const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: 'CN¥',
};

// Doughnut chart component
const DoughnutChart = ({ transactions, currencySymbol, theme }) => {
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');

        const expenseData = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
                return acc;
            }, {});

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        
        const textColor = theme === 'dark' ? '#e2e8f0' : '#334155';

        chartInstanceRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expenseData),
                datasets: [{
                    label: `Expenses in ${currencySymbol}`,
                    data: Object.values(expenseData),
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'],
                    hoverOffset: 4,
                    borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Expense Breakdown',
                        font: { size: 16 },
                        color: textColor
                    }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [transactions, currencySymbol, theme]);

    return <canvas ref={canvasRef}></canvas>;
};


// Transaction item component
const TransactionItem = ({ transaction, onEdit, onDelete, currencySymbol }) => {
    const isExpense = transaction.type === 'expense';
    const displayDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString();

    return (
        <li className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all animate-fade-in">
            <div className={`w-12 h-12 flex-shrink-0 mr-4 rounded-full flex items-center justify-center ${isExpense ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/20'}`}>
                {isExpense ? <TrendingDown className="text-red-500" /> : <TrendingUp className="text-green-500" />}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-slate-800 dark:text-slate-200">{transaction.text}</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.category}</p>
                    <span className="text-xs text-slate-400">•</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{displayDate}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isExpense ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                    {isExpense ? '-' : '+'}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                </p>
            </div>
            <div className="flex items-center ml-4 space-x-1">
                <button onClick={() => onEdit(transaction)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Edit size={16} />
                </button>
                <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </li>
    );
};

// Main Tracker Component
function ExpenseTracker({ user }) {
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [transactionType, setTransactionType] = useState('expense');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [editingId, setEditingId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // --- NEW: State for form validation errors ---
    const [formError, setFormError] = useState('');

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [currencyCode, setCurrencyCode] = useState(localStorage.getItem('currencyCode') || 'USD');

    // Effect for handling theme changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Effect for handling currency changes
    useEffect(() => {
        localStorage.setItem('currencyCode', currencyCode);
    }, [currencyCode]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const transactionsCollectionRef = collection(db, 'users', user.uid, 'transactions');

    useEffect(() => {
        const q = query(transactionsCollectionRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(transactionsData);
        });
        return () => unsubscribe();
    // --- THIS IS THE FIX ---
    // Added 'transactionsCollectionRef' to the dependency array as requested by the error.
    }, [user.uid, transactionsCollectionRef]);

    const { total, income, expense } = useMemo(() => {
        const amounts = transactions.map(t => t.amount);
        const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
        const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);
        return { total, income, expense };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date + 'T00:00:00');
            return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });
        if (filter === 'all') return monthlyTransactions;
        return monthlyTransactions.filter(t => t.type === filter);
    }, [transactions, filter, selectedDate]);

    const handleAddOrUpdateTransaction = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous errors

        // --- UPDATED: Form Validation ---
        if (!text || !date) {
            setFormError('Please fill out all fields.');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setFormError('Amount must be a positive number.');
            return;
        }
        // --- End of Validation ---

        const amountValue = transactionType === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
        const transactionData = { text, amount: amountValue, category, type: transactionType, date };

        try {
            if (editingId) {
                await updateDoc(doc(db, 'users', user.uid, 'transactions', editingId), transactionData);
                setEditingId(null);
            } else {
                await addDoc(transactionsCollectionRef, transactionData);
            }
            setText(''); setAmount(''); setTransactionType('expense'); setCategory('Food'); setDate(new Date().toISOString().slice(0, 10));
        } catch (err) {
            console.error("Firestore Error:", err);
            setFormError('Could not save transaction. Please try again.');
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
        } catch (err) {
            console.error("Firestore Error:", err);
        }
    };

    const handleEditTransaction = (transaction) => {
        setEditingId(transaction.id); setText(transaction.text); setAmount(Math.abs(transaction.amount));
        setTransactionType(transaction.type); setCategory(transaction.category); setDate(transaction.date);
        setFormError(''); // Clear errors when starting an edit
    };
    
    const handleLogout = () => signOut(auth);

    const handleMonthChange = (offset) => {
        setSelectedDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const currentCurrencySymbol = currencySymbols[currencyCode] || '$';

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 font-sans text-slate-800 dark:text-slate-200">
            <header className="max-w-6xl mx-auto mb-4 flex justify-between items-center">
                {/* ... existing header code ... */}
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow">
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow appearance-none">
                        {Object.entries(currencySymbols).map(([code, symbol]) => <option key={code} value={code}>{code} ({symbol})</option>)}
                    </select>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow">
                    <LogOut size={16} /> Logout
                </button>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Transaction' : 'Add New Transaction'}</h2>
                        <div className="flex mb-4 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                            {/* ... existing income/expense buttons ... */}
                            <button onClick={() => setTransactionType('expense')} className={`w-full py-2 rounded-md transition-colors text-sm font-semibold ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Expense</button>
                            <button onClick={() => setTransactionType('income')} className={`w-full py-2 rounded-md transition-colors text-sm font-semibold ${transactionType === 'income' ? 'bg-green-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Income</button>
                        </div>
                        <form onSubmit={handleAddOrUpdateTransaction} className="space-y-4">
                            <input type="text" placeholder="Description" value={text} onChange={e => setText(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200" />
                            
                            {/* --- UPDATED: Amount Input --- */}
                            <input 
                                type="number" 
                                placeholder="Amount" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                onKeyDown={(e) => {
                                    // Block 'e' and 'E' in number input
                                    if (e.key === 'e' || e.key === 'E') {
                                      e.preventDefault();
                                    }
                                }}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200" 
                            />
                            
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200" />
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200">
                                {/* ... existing options ... */}
                                {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            
                            {/* --- NEW: Display Form Error --- */}
                            {formError && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{formError}</p>}

                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                {/* ... existing button content ... */}
                                <Plus size={20} /> {editingId ? 'Update Transaction' : 'Add Transaction'}
                            </button>
                            
                            {/* --- UPDATED: Cancel Edit Button --- */}
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setText(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10)); setFormError(''); }} className="w-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all flex items-center justify-center gap-2">Cancel Edit</button>}
                        </form>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        {/* ... existing summary code ... */}
                        <h2 className="text-xl font-bold mb-4">Summary</h2>
                        <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">
                                <div className="flex items-center gap-3"><div className="p-2 bg-green-200 dark:bg-green-500/20 rounded-full"><TrendingUp className="text-green-600 dark:text-green-400" size={20} /></div><span className="font-semibold text-slate-600 dark:text-slate-300">Income</span></div>
                                <span className="font-bold text-green-600 dark:text-green-400 text-lg">{currentCurrencySymbol}{income}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
                                <div className="flex items-center gap-3"><div className="p-2 bg-red-200 dark:bg-red-500/20 rounded-full"><TrendingDown className="text-red-600 dark:text-red-400" size={20} /></div><span className="font-semibold text-slate-600 dark:text-slate-300">Expense</span></div>
                                <span className="font-bold text-red-600 dark:text-red-400 text-lg">{currentCurrencySymbol}{expense}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <div className="flex items-center gap-3"><div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-full"><DollarSign className="text-slate-600 dark:text-slate-300" size={20} /></div><span className="font-semibold text-slate-600 dark:text-slate-300">Balance</span></div>
                                <span className={`font-bold text-lg ${total >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-600 dark:text-red-400'}`}>{currentCurrencySymbol}{total}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        {/* ... existing chart code ... */}
                        <DoughnutChart transactions={transactions} currencySymbol={currentCurrencySymbol} theme={theme} />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    {/* ... existing transaction history code ... */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold">Transaction History</h2>
                         <div className="flex items-center gap-2 sm:gap-4 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => handleMonthChange(-1)} className="px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">&lt;</button>
                            <p className="font-semibold w-32 text-center">
                                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <button onClick={() => handleMonthChange(1)} className="px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">&gt;</button>
                        </div>
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>All</button>
                            <button onClick={() => setFilter('income')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'income' ? 'bg-green-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Income</button>
                            <button onClick={() => setFilter('expense')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === 'expense' ? 'bg-red-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Expense</button>
                        </div>
                    </div>
                    <ul className="space-y-3 h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredTransactions.map(t => <TransactionItem key={t.id} transaction={t} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} currencySymbol={currentCurrencySymbol} />)}
                        {filteredTransactions.length === 0 && <p className="text-center text-slate-500 mt-10">No transactions for this month.</p>}
                    </ul>
                </div>
            </main>
        </div>
    );
}

// Authentication Component
function AuthComponent() {
    // This component will also respect the theme from localStorage
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            // --- THIS IS THE CHANGE ---
            // Use the new translator function
            const friendlyMessage = getFriendlyErrorMessage(err);
            setError(friendlyMessage);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 text-center mb-2">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6">{isLogin ? 'Log in to track your expenses' : 'Sign up to get started'}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200" />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [user, setUser] = useState(null);
    // --- THIS IS THE FIX ---
    // Removed 'setLoading' as it was unused and causing a warning.
    const [loading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        // Also apply theme to loading screen
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">Loading...</p>
            </div>
        );
    }
    
    return user ? <ExpenseTracker user={user} /> : <AuthComponent />;
}

export default App;


