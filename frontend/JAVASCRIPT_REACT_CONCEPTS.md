# JavaScript & React Concepts Guide

## 📚 Complete Guide to Modern JavaScript & React Patterns

---

## 1️⃣ Fetch API vs Axios

### Fetch API (Native Browser)

```javascript
// Basic GET request
const fetchData = async () => {
  try {
    const response = await fetch('https://api.advanciapayledger.com/api/users');

    // Must manually check response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Must manually parse JSON
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

// POST request with Fetch
const createUser = async (userData) => {
  try {
    const response = await fetch('https://api.advanciapayledger.com/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData), // Must manually stringify
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Axios (Third-Party Library)

```javascript
import axios from 'axios';

// Basic GET request (auto JSON parsing, auto error handling)
const fetchData = async () => {
  try {
    const response = await axios.get('https://api.advanciapayledger.com/api/users');
    console.log(response.data); // Already parsed!
  } catch (error) {
    console.error('Axios error:', error.response?.data);
  }
};

// POST request with Axios (cleaner)
const createUser = async (userData) => {
  try {
    const response = await axios.post(
      'https://api.advanciapayledger.com/api/users',
      userData, // Axios auto-stringifies
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
};

// Axios instance with defaults (RECOMMENDED)
const api = axios.create({
  baseURL: 'https://api.advanciapayledger.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const users = await api.get('/users');
```

**When to use:**

- ✅ **Fetch**: Simple requests, no dependencies
- ✅ **Axios**: Complex apps, better error handling, interceptors

---

## 2️⃣ Async/Await

### Without Async/Await (Promise Chains)

```javascript
// Old way - Promise chains
function getUser() {
  fetch('/api/users/1')
    .then((response) => response.json())
    .then((user) => {
      console.log(user);
      return fetch(`/api/posts?userId=${user.id}`);
    })
    .then((response) => response.json())
    .then((posts) => {
      console.log(posts);
    })
    .catch((error) => {
      console.error(error);
    });
}
```

### With Async/Await (Modern)

```javascript
// Modern way - async/await
async function getUser() {
  try {
    // Wait for user data
    const userResponse = await fetch('/api/users/1');
    const user = await userResponse.json();
    console.log(user);

    // Wait for posts data
    const postsResponse = await fetch(`/api/posts?userId=${user.id}`);
    const posts = await postsResponse.json();
    console.log(posts);
  } catch (error) {
    console.error(error);
  }
}

// Multiple parallel requests
async function loadDashboard() {
  try {
    // Run all requests in parallel (faster!)
    const [users, transactions, stats] = await Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/transactions').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ]);

    console.log({ users, transactions, stats });
  } catch (error) {
    console.error(error);
  }
}
```

---

## 3️⃣ React Query (TanStack Query)

**Best for:** Server state management, caching, automatic refetching

```bash
npm install @tanstack/react-query
```

### Setup

```tsx
// frontend/src/app/layout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function RootLayout({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            cacheTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
```

### Usage

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// GET request with auto caching & refetching
function UsersList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users'], // Cache key
    queryFn: async () => {
      const response = await axios.get('/api/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {data.users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// POST/PUT/DELETE with mutations
function CreateUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) => {
      return axios.post('/api/users', newUser);
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ name: 'John', email: 'john@example.com' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {mutation.isError && <div>Error: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>User created!</div>}
    </form>
  );
}
```

**Benefits:**

- ✅ Auto caching
- ✅ Auto refetching
- ✅ Loading/error states
- ✅ Optimistic updates
- ✅ Pagination support

---

## 4️⃣ SWR (Stale-While-Revalidate)

**Best for:** Real-time data, auto revalidation

```bash
npm install swr
```

### Usage

```tsx
import useSWR from 'swr';

// Fetcher function
const fetcher = (url) => fetch(url).then((r) => r.json());

function TransactionsList() {
  const { data, error, isLoading, mutate } = useSWR('/api/transactions', fetcher, {
    refreshInterval: 3000, // Auto refresh every 3 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading transactions</div>;

  return (
    <div>
      <button onClick={() => mutate()}>Refresh</button>
      {data.transactions.map((tx) => (
        <div key={tx.id}>
          {tx.amount} - {tx.status}
        </div>
      ))}
    </div>
  );
}

// With token
function SecureTransactions() {
  const token = localStorage.getItem('token');

  const fetcher = async (url) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  };

  const { data } = useSWR('/api/transactions', fetcher);

  return <div>{/* ... */}</div>;
}
```

---

## 5️⃣ Array.map() Function

### Basic Usage

```javascript
const numbers = [1, 2, 3, 4, 5];

// Transform array
const doubled = numbers.map((num) => num * 2);
// Result: [2, 4, 6, 8, 10]

const squared = numbers.map((num) => num ** 2);
// Result: [1, 4, 9, 16, 25]
```

### React Usage (Rendering Lists)

```tsx
function UsersList() {
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ];

  return (
    <div>
      <h2>Users List</h2>
      {users.map((user) => (
        <div key={user.id} className="user-card">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

// With index (avoid using index as key if list changes)
function NumbersList() {
  const numbers = [10, 20, 30, 40];

  return (
    <ul>
      {numbers.map((num, index) => (
        <li key={index}>
          Item {index + 1}: {num}
        </li>
      ))}
    </ul>
  );
}
```

### Advanced Map Examples

```javascript
// Extract specific properties
const users = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
];

const names = users.map((user) => user.name);
// Result: ['Alice', 'Bob']

// Transform to new structure
const userSummaries = users.map((user) => ({
  fullName: user.name,
  isAdult: user.age >= 18,
}));
// Result: [
//   { fullName: 'Alice', isAdult: true },
//   { fullName: 'Bob', isAdult: true }
// ]

// Chain with filter
const adults = users.filter((user) => user.age >= 18).map((user) => user.name);
```

### Real-World Advancia Pay Example

```tsx
function TransactionsList() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Transactions</h2>

      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="p-4 border rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{transaction.description}</h3>
              <p className="text-gray-600 text-sm">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
              >
                {transaction.type === 'credit' ? '+' : '-'}${transaction.amount}
              </p>
              <span
                className={`text-xs px-2 py-1 rounded ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 6️⃣ Creating Arrays & Adding Elements

```javascript
// 1. Array literal (most common)
const users = ['Alice', 'Bob', 'Charlie'];

// 2. Array constructor
const numbers = new Array(5); // Creates [undefined, undefined, undefined, undefined, undefined]
const colors = new Array('red', 'blue', 'green');

// 3. Array.from()
const range = Array.from({ length: 5 }, (_, i) => i + 1);
// Result: [1, 2, 3, 4, 5]

// 4. Spread operator
const original = [1, 2, 3];
const copy = [...original]; // Creates new array

// Adding elements
const items = [];

// Push (add to end)
items.push('item1');
items.push('item2');
console.log(items); // ['item1', 'item2']

// Unshift (add to beginning)
items.unshift('item0');
console.log(items); // ['item0', 'item1', 'item2']

// Spread (immutable - creates new array)
const newItems = [...items, 'item3']; // Add to end
const moreItems = ['itemNeg1', ...items]; // Add to beginning

// Concat
const combined = items.concat(['item4', 'item5']);
```

### React State with Arrays

```tsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  // Add item (immutable way)
  const addTodo = () => {
    setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
    setInput('');
  };

  // Remove item
  const removeTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Update item
  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add todo..." />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 7️⃣ Closures

**Closure:** A function that "remembers" variables from its outer scope

```javascript
// Basic closure
function createCounter() {
  let count = 0; // Private variable

  return function () {
    count++; // Inner function accesses outer variable
    return count;
  };
}

const counter1 = createCounter();
console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter1()); // 3

const counter2 = createCounter(); // Separate closure
console.log(counter2()); // 1 (independent from counter1)

// Practical example: Private data
function createBankAccount(initialBalance) {
  let balance = initialBalance; // Private - can't access directly

  return {
    deposit: function (amount) {
      balance += amount;
      return balance;
    },
    withdraw: function (amount) {
      if (amount > balance) {
        return 'Insufficient funds';
      }
      balance -= amount;
      return balance;
    },
    getBalance: function () {
      return balance;
    },
  };
}

const account = createBankAccount(1000);
console.log(account.getBalance()); // 1000
account.deposit(500); // 1500
account.withdraw(200); // 1300
console.log(account.balance); // undefined (private!)
```

### React Closure Example

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // Closure: handleClick "remembers" count
  const handleClick = () => {
    console.log('Current count:', count);
    setCount(count + 1);
  };

  // setTimeout closure issue
  const handleDelayedLog = () => {
    setTimeout(() => {
      console.log('Count after 3 seconds:', count); // Captures current count
    }, 3000);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
      <button onClick={handleDelayedLog}>Log after 3s</button>
    </div>
  );
}

// Event handlers with closures
function UserList() {
  const users = ['Alice', 'Bob', 'Charlie'];

  // Each handleClick "closes over" the specific user
  return (
    <div>
      {users.map((user, index) => {
        const handleClick = () => {
          console.log(`Clicked ${user}`);
        };

        return (
          <button key={index} onClick={handleClick}>
            {user}
          </button>
        );
      })}
    </div>
  );
}
```

---

## 8️⃣ Callback Functions

**Callback:** A function passed as an argument to another function

```javascript
// Basic callback
function greet(name, callback) {
  console.log(`Hello, ${name}!`);
  callback();
}

greet('Alice', function () {
  console.log('Callback executed!');
});

// With arrow function
greet('Bob', () => {
  console.log('Arrow callback!');
});

// Array methods use callbacks
const numbers = [1, 2, 3, 4, 5];

// map callback
numbers.map((num) => num * 2);

// filter callback
numbers.filter((num) => num > 3);

// forEach callback
numbers.forEach((num) => {
  console.log(num);
});

// find callback
numbers.find((num) => num === 3);

// reduce callback
numbers.reduce((sum, num) => sum + num, 0);
```

### Async Callbacks

```javascript
// Old-style async callbacks (callback hell)
function fetchUser(id, callback) {
  setTimeout(() => {
    callback({ id, name: 'Alice' });
  }, 1000);
}

fetchUser(1, (user) => {
  console.log(user);
  fetchUser(2, (user2) => {
    console.log(user2);
    // Callback hell! 😱
  });
});

// Modern async/await (better)
async function getUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: 'Alice' });
    }, 1000);
  });
}

const user1 = await getUser(1);
const user2 = await getUser(2);
```

### React Callbacks

```tsx
// Parent-child communication via callbacks
function Parent() {
  const [message, setMessage] = useState('');

  // Callback passed to child
  const handleChildClick = (childData) => {
    setMessage(`Child sent: ${childData}`);
  };

  return (
    <div>
      <p>{message}</p>
      <Child onButtonClick={handleChildClick} />
    </div>
  );
}

function Child({ onButtonClick }) {
  return <button onClick={() => onButtonClick('Hello from child!')}>Click Me</button>;
}

// Event handlers (callbacks)
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  const handleChange = (e) => {
    console.log('Input changed:', e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 🎯 Complete Example: Advancia Pay Dashboard

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// API client with interceptors (Axios)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard Component
export default function Dashboard() {
  // React Query for server state
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data.transactions;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Async function to create transaction
  const createTransaction = async (amount, description) => {
    try {
      const response = await api.post('/transactions', {
        amount,
        description,
        type: 'credit',
      });

      // Refetch transactions after creation
      refetch();

      return response.data;
    } catch (err) {
      console.error('Error creating transaction:', err);
    }
  };

  // Callback function for transaction item click
  const handleTransactionClick = (transaction) => {
    console.log('Transaction clicked:', transaction);
    // Could open modal, navigate, etc.
  };

  // Closure example: filter transactions
  const createFilter = (type) => {
    // This function "closes over" the type parameter
    return (transaction) => transaction.type === type;
  };

  const creditFilter = createFilter('credit');
  const debitFilter = createFilter('debit');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading transactions: {error.message}
        </div>
      </div>
    );
  }

  // Calculate totals using reduce (callback)
  const totalCredit = transactions
    .filter(creditFilter) // Closure used as callback
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalDebit = transactions
    .filter(debitFilter) // Closure used as callback
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => refetch()} // Callback
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Total Credits</h3>
          <p className="text-3xl font-bold text-green-600">${totalCredit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Total Debits</h3>
          <p className="text-3xl font-bold text-red-600">${totalDebit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Balance</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${(totalCredit - totalDebit).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transactions List using .map() */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>

        <div className="divide-y">
          {transactions.map(
            (
              transaction // Array.map()
            ) => (
              <div
                key={transaction.id}
                onClick={() => handleTransactionClick(transaction)} // Callback
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{transaction.description}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}$
                      {parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No transactions yet</p>
          <button
            onClick={() => createTransaction(100, 'Test Transaction')} // Async callback
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Test Transaction
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🎓 Quick Reference

| Concept         | Use Case             | Syntax                                   |
| --------------- | -------------------- | ---------------------------------------- |
| **Fetch**       | Native API calls     | `const res = await fetch(url)`           |
| **Axios**       | Better API client    | `const res = await axios.get(url)`       |
| **Async/Await** | Handle promises      | `async function f() { await ... }`       |
| **React Query** | Server state + cache | `useQuery({ queryKey, queryFn })`        |
| **SWR**         | Real-time data       | `useSWR(url, fetcher)`                   |
| **map()**       | Transform arrays     | `array.map(item => ...)`                 |
| **Arrays**      | Store lists          | `const arr = [1, 2, 3]`                  |
| **Closures**    | Private variables    | `function outer() { let x; return ... }` |
| **Callbacks**   | Pass functions       | `func((param) => { ... })`               |

---

## ✅ Best Practices for Advancia Pay

1. **Use Axios** over Fetch for API calls (better error handling)
2. **Use React Query** for server data (auto caching, refetching)
3. **Always use async/await** instead of .then() chains
4. **Use .map()** for rendering lists in React
5. **Keep state immutable** when updating arrays (use spread operator)
6. **Use closures** for private data and event handlers
7. **Use callbacks** for parent-child communication
8. **Add loading/error states** for all async operations

---

**🎉 You now have a complete guide to modern JavaScript & React patterns!**
