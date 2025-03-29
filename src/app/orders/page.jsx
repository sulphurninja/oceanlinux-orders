'use client';

import React, { useEffect, useState, useRef } from 'react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    // Fetch existing orders
    fetch('/api/orders/all')
      .then(response => response.json())
      .then(data => {
        const sortedOrders = data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setOrders(sortedOrders);
      })
      .catch(error => console.error('Failed to load orders:', error));
  }, []);

  // Handle changes inside the dialog
  const handleInputChange = (field, value) => {
    setSelectedOrder(prev => (prev ? { ...prev, [field]: value } : null));
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
        status: selectedOrder.status, // <--- Include status here
      }),
    })
      .then(response => response.json()) // <--- Only parse JSON once
      .then(() => {
        alert('Order updated successfully');
        // Close the dialog
        setSelectedOrder(null);
        dialogRef.current.close();

        // Optionally, refresh the orders list or update state in place
        // e.g., re-fetch or manually update orders array to reflect changes
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
      .then((data) => {
        alert('Order deleted successfully');
        // Optionally remove from local state
        setOrders(prev => prev.filter(order => order._id !== orderId));
      })
      .catch(error => console.error('Error deleting order:', error));
  };

  return (
    <div>
      <h1 style={styles.header}>All Orders - Update Credentials</h1>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Product Name</th>
              <th>Memory</th>
              <th>Status</th>
              <th>OS</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.transactionId}</td>
                <td>{order.productName}</td>
                <td>{order.memory}</td>
                <td>{order.status}</td>
                <td>{order.os}</td>
                <td>
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
      </div>

      {/* Dialog for updating an order */}
      {selectedOrder && (
        <dialog ref={dialogRef} style={styles.dialog}>
          <h2>Update Order</h2>
          <p>Update IP, Username, Password, OS, and Status for the order.</p>
          <div>
            <strong>Transaction ID:</strong> {selectedOrder.transactionId}
          </div>

          <input
            type="text"
            placeholder="IP Address"
            value={selectedOrder.ipAddress || ''}
            onChange={e => handleInputChange('ipAddress', e.target.value)}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Username"
            value={selectedOrder.username || ''}
            onChange={e => handleInputChange('username', e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={selectedOrder.password || ''}
            onChange={e => handleInputChange('password', e.target.value)}
            style={styles.input}
          />

          <select
            value={selectedOrder.os || 'CentOS 7'}
            onChange={e => handleInputChange('os', e.target.value)}
            style={styles.input}
          >
            <option value="CentOS 7">CentOS 7</option>
            <option value="Ubuntu 22">Ubuntu 22</option>
          </select>

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
              Close
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default AdminOrders;

// Example CSS-in-JS styles
const styles = {
  header: {
    padding: '16px',
    fontSize: '20px',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
    textAlign: 'center',
  },
  tableContainer: {
    margin: '20px auto',
    width: '90%',
    border: '1px solid #ddd',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  button: {
    padding: '8px 12px',
    margin: '5px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  buttonDelete: {
    padding: '8px 12px',
    margin: '5px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  buttonClose: {
    padding: '8px 12px',
    margin: '5px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  dialog: {
    width: '300px',
    padding: '20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'white',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
};
