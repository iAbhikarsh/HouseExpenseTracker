// Initial Budget
const totalBudget = 693000;
let totalSpent = 0;
let expenses = [];

// Firebase Configuration
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

// Function to Load Expenses from Firebase
async function loadExpenses() {
    try {
        const expensesSnapshot = await db.collection("expenses").orderBy("timestamp", "desc").get();
        expenses = expensesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.date,
                name: data.name,
                category: data.category,
                expense: parseFloat(data.expense) || 0  // Convert to number
            };
        });

        // Calculate Total Spent
        totalSpent = expenses.reduce((sum, item) => sum + item.expense, 0);

        // Update UI
        updateExpenseTable();
        updateCategorySummary();
        document.getElementById("totalSpent").textContent = totalSpent.toFixed(2);

        // Update the Chart
        updateBudgetChart();
    } catch (error) {
        console.error("Error loading expenses:", error);
    }
}

// Load data on page load
window.onload = loadExpenses;

// Initialize Pie Chart
const ctx = document.getElementById('budgetChart').getContext('2d');
const budgetChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Amount Left', 'Amount Spent'],
        datasets: [{
            data: [totalBudget, totalSpent],  // Initial values
            backgroundColor: ['#4caf50', '#f44336'], // Green for left, Red for spent
        }]
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        const value = tooltipItem.raw;
                        const percentage = ((value / totalBudget) * 100).toFixed(2);
                        return `${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
        },
    }
});

// Function to Update Pie Chart
function updateBudgetChart() {
    const amountLeft = totalBudget - totalSpent;
    const amountSpent = totalSpent;

    // Update Chart Data
    budgetChart.data.datasets[0].data = [amountLeft, amountSpent];

    // Update the Chart
    budgetChart.update();
}

// Expense Form Submission
document.getElementById('expenseForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const expense = parseFloat(document.getElementById('expense').value);

    saveExpense(date, name, category, expense);

    document.getElementById('expenseForm').reset();
});

// Function to Save Expense in Firebase
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
        loadExpenses(); // Refresh data after adding
    } catch (error) {
        console.error("Error adding expense:", error);
    }
}

// Function to Update Expense Table
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

// Function to Update Category Summary
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
