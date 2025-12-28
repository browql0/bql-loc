import React, { useState, useEffect } from 'react';
import {
    Download,
    Search,
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    ArrowUpRight,
    MoreVertical,
    Filter
} from 'lucide-react';
import './Payment.css';
import { supabase } from '../../lib/supabase';

const PaymentTab = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const stats = [
        { label: 'Revenu Total', value: '128,450 DH', change: '+12.5%', icon: DollarSign, trend: 'up' },
        { label: 'Transactions', value: '245', change: '+5.2%', icon: CreditCard, trend: 'up' },
        { label: 'Panier Moyen', value: '524 DH', change: '-2.1%', icon: TrendingUp, trend: 'down' },
    ];

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*, clients(name)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    setTransactions(data.map(b => ({
                        id: b.id.substring(0, 8).toUpperCase(),
                        client: b.clients?.name || 'Client Inconnu',
                        date: new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
                        amount: (b.total_price || 0) + ' DH',
                        method: 'Virement', // Placeholder since DB doesn't have method column
                        status: b.status === 'confirmed' ? 'Succès' : b.status === 'pending' ? 'En attente' : b.status
                    })));
                }
            } catch (error) {
                console.error("Error fetching payments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="payment-tab">
            <div className="tab-header">
                <div className="header-info">
                    <h2>Historique des Paiements</h2>
                    <p>Suivez vos revenus et gérez les transactions de votre agence.</p>
                </div>
                <button className="btn-export">
                    <Download size={18} />
                    <span>Exporter CSV</span>
                </button>
            </div>

            <div className="stats-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="stat-card">
                        <div className={`stat-icon-wrapper ${stat.trend}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-value-group">
                                <span className="stat-value">{stat.value}</span>
                                <span className={`stat-change ${stat.trend}`}>
                                    {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="table-container glass-table">
                <div className="table-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher une transaction..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-filter-icon">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="scrollable-table">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID Transaction</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Méthode</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((trx) => (
                                <tr key={trx.id}>
                                    <td><span className="trx-id">{trx.id}</span></td>
                                    <td>
                                        <div className="client-info">
                                            <div className="client-avatar">{trx.client.charAt(0)}</div>
                                            <span>{trx.client}</span>
                                        </div>
                                    </td>
                                    <td>{trx.date}</td>
                                    <td>{trx.method}</td>
                                    <td><span className="amount-text">{trx.amount}</span></td>
                                    <td>
                                        <span className="status-pill" data-status={trx.status}>{trx.status}</span>
                                    </td>
                                    <td>
                                        <button className="action-dots"><MoreVertical size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentTab;
