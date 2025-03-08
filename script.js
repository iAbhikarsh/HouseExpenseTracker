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
            data.date=new Date(data.date);
            return {
                date: data.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
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

        console.log("Expense added successfully!");
        loadExpenses(); // Refresh data after adding

        // Show toaster notification
        showToaster("Expense added successfully!");
    } catch (error) {
        console.error("Error adding expense:", error);
    }
}

// Function to Show Toaster Notification
function showToaster(message) {
    const toaster = document.getElementById("toaster");
    toaster.textContent = message;
    toaster.classList.add("show");

    setTimeout(() => {
        toaster.classList.remove("show");
    }, 3000); // Hide toaster after 3 seconds
}


// Function to Update Expense Table
function updateExpenseTable() {
    const tbody = document.querySelector('#expenseTable tbody');
    tbody.innerHTML = '';
    expenses.reverse();
    expenses.forEach((expense,index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index+1}</td>
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

function filterExpenses() {
    const selectedCategory = document.getElementById("expenseFilter").value;
    const selectedDate = document.getElementById("dateFilter").value;
    const tbody = document.querySelector("#expenseTable tbody");
    tbody.innerHTML = "";

    let filteredExpenses = expenses;

    // Filter by Category
    if (selectedCategory !== "All") {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === selectedCategory);
    }

    // Filter by Date (Only if a date is selected)
    if (selectedDate) {
        const formattedSelectedDate = formatDate(selectedDate);
        filteredExpenses = filteredExpenses.filter(expense => formatDate(expense.date) === formattedSelectedDate);
    }

    // Populate table with filtered data
    filteredExpenses.forEach((expense, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="small-col">${index + 1}</td>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>${expense.expense.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });

    // Update total spent after filtering
    const totalFilteredSpent = filteredExpenses.reduce((sum, item) => sum + item.expense, 0);
    document.getElementById("totalSpent").textContent = totalFilteredSpent.toFixed(2);
}

// Function to format date as "17 Feb"
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If the date is invalid, return as is
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}



function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';

    // Collapse menu on mobile when a menu item is clicked
    document.getElementById("menu").classList.remove("active");
}

function toggleMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("active");
}

// Show Dashboard on Page Load
document.addEventListener("DOMContentLoaded", function () {
    showPage('dashboard');
});

// Function to check login status
function checkAuth() {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
        window.location.href = "login.html";
    }
}

// Function to handle login
async function login(event) {
    //showSpinner();
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    try {
        const querySnapshot = await db.collection("user").where("username", "==", username).get();
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            if (userData.password === password) {
                // Update isLoggedIn field
                await db.collection("user").doc(userDoc.id).update({ isLoggedIn: true });
                localStorage.setItem("loggedInUser", username);
                window.location.href = "index.html";
                //hideSpinner();
            } else {
                alert("Incorrect password!");
                //hideSpinner();
            }
        } else {
            alert("User not found!");
           // hideSpinner();
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed! Try again.");
       // hideSpinner();
    }
}

// Function to handle logout
async function logout() {
    const user = localStorage.getItem("loggedInUser");
    if (user) {
        try {
            const querySnapshot = await db.collection("user").where("username", "==", user).get();
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await db.collection("user").doc(userDoc.id).update({ isLoggedIn: false });
            }
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed! Try again.");
        }
    }
}

function showSpinner() {
    document.getElementById("spinner-container").style.display = "flex";
}
function hideSpinner() {
    document.getElementById("spinner-container").style.display = "none";
}