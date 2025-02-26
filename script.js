// Initial Budget
const totalBudget = 693000;
let totalSpent = 0;
let expenses = [];

//  // Import the functions you need from the SDKs you need
//  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
//  // TODO: Add SDKs for Firebase products that you want to use
//  // https://firebase.google.com/docs/web/setup#available-libraries

 // Your web app's Firebase configuration
 const firebaseConfig = {
     apiKey: "AIzaSyCdThUJfzV5LcmQ9jsojAmL-iBzjmbh0GI",
   authDomain: "house-expense-tracker-61661.firebaseapp.com",
   projectId: "house-expense-tracker-61661",
   storageBucket: "house-expense-tracker-61661.firebasestorage.app",
   messagingSenderId: "369950928899",
   appId: "1:369950928899:web:b7fcaef494570e94f75e36"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();



async function loadExpenses() {
    const expensesSnapshot = await db.collection("expenses").orderBy("timestamp", "desc").get();
    expenses = expensesSnapshot.docs.map(doc => {
      const data = doc.data();
            return {
                date: data.date,
                name: data.name,
                category: data.category,
                expense: parseFloat(data.expense) || 0  // Convert expense to number
            };
    }
  );

    totalSpent = expenses.reduce((sum, item) => sum + item.expense, 0);
    updateExpenseTable();
    updateCategorySummary();
}

  
  // Load data on page load
window.onload = loadExpenses;;
  
// Pie Chart
const ctx = document.getElementById('budgetChart').getContext('2d');
const budgetChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Amount Left', 'Amount Spent'],
    datasets: [{
      data: [totalBudget, totalSpent],
      backgroundColor: ['#4caf50', '#f44336'],
    }]
  }
});

// Expense Form
document.getElementById('expenseForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const expense = parseFloat(document.getElementById('expense').value);

    saveExpense(date, name, category, expense);

    document.getElementById('expenseForm').reset();
});


// Update Expense Table
function updateExpenseTable() {
  const tbody = document.querySelector('#expenseTable tbody');
  tbody.innerHTML = '';

  expenses.forEach(expense => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${expense.date}</td>
      <td>${expense.name}</td>
      <td>${expense.category}</td>
      <td>${expense.expense.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });

  // Update Total Spent
  document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);
}

// Update Category Summary
function updateCategorySummary() {
  const summary = { 'Material': 0, 'Mason/Labor': 0 };

  expenses.forEach(expense => {
    summary[expense.category] += expense.expense;
  });

  const tbody = document.querySelector('#categorySummary tbody');
  tbody.innerHTML = '';

  for (const [category, total] of Object.entries(summary)) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${category}</td>
      <td>${total.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  }
}


async function saveExpense(date, name, category, expense) {
    try {
        await db.collection("expenses").add({
            date,
            name,
            category,
            expense: parseFloat(expense),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Expense added!");
        loadExpenses(); // Refresh the table
    } catch (error) {
        console.error("Error adding expense:", error);
    }
}

  
document.getElementById('expenseForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const date = document.getElementById('date').value;
  const name = document.getElementById('name').value;
  const category = document.getElementById('category').value;
  const expense = parseFloat(document.getElementById('expense').value);

  saveExpense(date, name, category, expense);  // ✅ Call the Firebase function instead

  document.getElementById('expenseForm').reset();
});