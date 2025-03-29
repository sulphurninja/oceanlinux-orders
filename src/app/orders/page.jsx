'use client';

import React, { useEffect, useState, useRef } from 'react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderMetrics, setOrderMetrics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    verified: 0,
    invalid: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    os: '',
    search: '',
    dateRange: 'all'
  });
  
  const dialogRef = useRef(null);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get relative time (e.g. "2 hours ago")
  const getRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays} days ago`;
      
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} months ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  useEffect(() => {
    // Fetch existing orders
    setLoading(true);
    fetch('/api/orders/all')
      .then(response => response.json())
      .then(data => {
        const sortedOrders = data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
        
        // Calculate metrics
        const metrics = {
          total: sortedOrders.length,
          completed: sortedOrders.filter(order => order.status === 'completed').length,
          pending: sortedOrders.filter(order => order.status === 'pending').length,
          verified: sortedOrders.filter(order => order.status === 'verified').length,
          invalid: sortedOrders.filter(order => order.status === 'invalid').length
        };
        setOrderMetrics(metrics);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load orders:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...orders];
    
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    
    if (filters.os) {
      result = result.filter(order => order.os === filters.os);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(order => 
        (order.transactionId && order.transactionId.toLowerCase().includes(searchLower)) ||
        (order.productName && order.productName.toLowerCase().includes(searchLower)) ||
        (order.ipAddress && order.ipAddress.toLowerCase().includes(searchLower)) ||
        (order.username && order.username.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      result = result.filter(order => new Date(order.updatedAt) >= cutoff);
    }
    
    setFilteredOrders(result);
  }, [filters, orders]);

  // Handle changes inside the dialog
  const handleInputChange = (field, value) => {
    setSelectedOrder(prev => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Update order with new credentials/status/OS
  const handleUpdate = () => {
    if (!selectedOrder) return;

    fetch('/api/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedOrder._id,
        username: selectedOrder.username,
        password: selectedOrder.password,
        ipAddress: selectedOrder.ipAddress,
        os: selectedOrder.os,
        status: selectedOrder.status,
      }),
    })
      .then(response => response.json())
      .then(() => {
        alert('Order updated successfully');
        
        // Update order in local state
        setOrders(prev => 
          prev.map(order => 
            order._id === selectedOrder._id ? selectedOrder : order
          )
        );
        
        // Close the dialog
        setSelectedOrder(null);
        dialogRef.current.close();
      })
      .catch(error => console.error('Error updating order:', error));
  };

  // Delete order
  const handleDelete = (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(() => {
        alert('Order deleted successfully');
        // Optionally remove from local state
        setOrders(prev => prev.filter(order => order._id !== orderId));
      })
      .catch(error => console.error('Error deleting order:', error));
  };

  const StatusBadge = ({ status }) => {
    let badgeStyle = { ...styles.badge };
    
    switch(status) {
      case 'completed':
        badgeStyle = { ...badgeStyle, ...styles.badgeCompleted };
        break;
      case 'pending':
        badgeStyle = { ...badgeStyle, ...styles.badgePending };
        break;
      case 'verified':
        badgeStyle = { ...badgeStyle, ...styles.badgeVerified };
        break;
      case 'invalid':
        badgeStyle = { ...badgeStyle, ...styles.badgeInvalid };
        break;
      default:
        break;
    }
    
    return <span style={badgeStyle}>{status}</span>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        <div style={styles.header}>
          <h1>Orders Dashboard</h1>
          <div style={styles.statsContainer}>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{orderMetrics.total}</span>
              <span style={styles.statLabel}>Total Orders</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{orderMetrics.completed}</span>
              <span style={styles.statLabel}>Completed</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{orderMetrics.pending}</span>
              <span style={styles.statLabel}>Pending</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{orderMetrics.verified}</span>
              <span style={styles.statLabel}>Verified</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{orderMetrics.invalid}</span>
              <span style={styles.statLabel}>Invalid</span>
            </div>
          </div>
        </div>

        <div style={styles.filtersBar}>
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="completed">Completed</option>
            <option value="invalid">Invalid</option>
          </select>

          <select
            value={filters.os}
            onChange={(e) => handleFilterChange('os', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All OS</option>
            <option value="CentOS 7">CentOS 7</option>
            <option value="Ubuntu 22">Ubuntu 22</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading orders...</div>
        ) : (
          <div style={styles.tableContainer}>
            {filteredOrders.length === 0 ? (
              <div style={styles.noResults}>No orders match your filters.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th>Payment ID</th>
                    <th>Product Name</th>
                    <th>Memory</th>
                    <th>Status</th>
                    <th>OS</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order._id} style={styles.tableRow}>
                      <td>{order.transactionId}</td>
                      <td>{order.productName}</td>
                      <td>{order.memory}</td>
                      <td><StatusBadge status={order.status}/></td>
                      <td>{order.os}</td>
                      <td>
                        {/* <div>{formatDate(order.updatedAt)}</div> */}
                        <div style={styles.relativeTime}>{getRelativeTime(order.updatedAt)}</div>
                      </td>
                      <td style={styles.actionsCell}>
                        <button
                          style={styles.button}
                          onClick={() => {
                            setSelectedOrder(order);
                            dialogRef.current.showModal();
                          }}
                        >
                          Update
                        </button>
                        <button
                          style={styles.buttonDelete}
                          onClick={() => handleDelete(order._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Dialog for updating an order */}
      {selectedOrder && (
        <dialog ref={dialogRef} style={styles.dialog}>
          <h2 style={styles.dialogTitle}>Update Order</h2>
          <p>Update IP, Username, Password, OS, and Status for the order.</p>
          <div style={styles.dialogInfo}>
            <strong>Transaction ID:</strong> {selectedOrder.transactionId}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>IP Address</label>
            <input
              type="text"
              placeholder="IP Address"
              value={selectedOrder.ipAddress || ''}
              onChange={e => handleInputChange('ipAddress', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={selectedOrder.username || ''}
              onChange={e => handleInputChange('username', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={selectedOrder.password || ''}
              onChange={e => handleInputChange('password', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Operating System</label>
            <select
              value={selectedOrder.os || 'CentOS 7'}
              onChange={e => handleInputChange('os', e.target.value)}
              style={styles.input}
            >
              <option value="CentOS 7">CentOS 7</option>
              <option value="Ubuntu 22">Ubuntu 22</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Order Status</label>
            <select
              value={selectedOrder.status || 'pending'}
              onChange={e => handleInputChange('status', e.target.value)}
              style={styles.input}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>

          <div style={styles.buttonGroup}>
            <button style={styles.button} onClick={handleUpdate}>
              Save Changes
            </button>
            <button
              style={styles.buttonClose}
              onClick={() => {
                dialogRef.current.close();
                setSelectedOrder(null);
              }}
            >
              Cancel
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default AdminOrders;

// Modern CSS-in-JS styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    padding: '20px',
    color: '#333',
  },
  dashboard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #e9ecef',
  },
  statsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '20px',
  },
  stat: {
    flex: '1 0 150px',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6c757d',
  },
  filtersBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '15px 24px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    flex: '1 0 200px',
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    backgroundColor: 'white',
    fontSize: '14px',
  },
  tableContainer: {
    padding: '24px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
  },
  tableHeader: {
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
  },
  tableHeader: {
    '& th': {
      padding: '12px 15px',
      fontWeight: '600',
      fontSize: '14px',
      borderBottom: '2px solid #e9ecef',
      color: '#495057',
    }
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
    borderBottom: '1px solid #e9ecef',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '16px',
  },
  noResults: {
    padding: '40px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '16px',
  },
  button: {
    padding: '8px 12px',
    margin: '3px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#303f9f',
    }
  },
  buttonDelete: {
    padding: '8px 12px',
    margin: '3px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#c82333',
    }
  },
  buttonClose: {
    padding: '8px 12px',
    margin: '3px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#5a6268',
    }
  },
  actionsCell: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: '5px',
  },
  relativeTime: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '3px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  badgeCompleted: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  badgePending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  badgeVerified: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
  badgeInvalid: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  dialog: {
    width: '400px',
    padding: '25px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  dialogTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '20px',
  },
  dialogInfo: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'border-color 0.15s ease-in-out',
    '&:focus': {
      borderColor: '#3f51b5',
      outline: 'none',
    }
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
};