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
let currentEditId = null; // To track the ID of the expense being edited
let currentRowToEdit = null; // To track the row being edited (DOM element)
let showActionColumn = false;
const editModal = document.getElementById("editModal");
const editDateInput = document.getElementById("editDate");
const editNameInput = document.getElementById("editName");
const editCategorySelect = document.getElementById("editCategory");
const editExpenseInput = document.getElementById("editExpense");
const saveEditButton = document.getElementById("saveEdit");
const cancelEditButton = document.getElementById("cancelEdit"); // Get the cancel button

// Function to Load Expenses from Firebase; c   
async function loadExpenses() {
    try {
        const expensesSnapshot = await db.collection("expenses").orderBy("timestamp", "desc").get();
        expenses = expensesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, // Access the document ID here
                date: new Date(data.date),
                name: data.name,
                category: data.category,
                expense: parseFloat(data.expense) || 0
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
let userLoggedIn;
window.onload = function () {
    if (!window.location.pathname.includes("/login.html") && (!window.location.pathname.includes("/unauthorized.html"))) {
        checkAuth();
    }
    if (userLoggedIn) {
        loadExpenses();
    }
};
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
// Expense Form Submission (for adding new expenses)
document.getElementById('expenseForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const expense = parseFloat(document.getElementById('expense').value);

    saveExpense(date, name, category, expense);

    document.getElementById('expenseForm').reset();
});
// Function to Save New Expense in Firebase
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

// Function to Update Existing Expense in Firebase (takes updated expense object)
async function updateExpenseInFirebase(updatedExpense) {
    try {
        await db.collection("expenses").doc(updatedExpense.id).update({
            date: updatedExpense.date,
            name: updatedExpense.name,
            category: updatedExpense.category,
            expense: parseFloat(updatedExpense.expense),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Expense with ID ${updatedExpense.id} updated successfully!`);
        loadExpenses(); // Refresh data after updating
        showToaster("Expense updated successfully!");
    } catch (error) {
        console.error(`Error updating expense with ID ${updatedExpense.id}:`, error);
    } finally {
        editModal.style.display = "none";
        currentRowToEdit = null;
        currentEditId = null;

    }
}

// Function to Delete Expense from Firebase
async function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        try {
            await db.collection("expenses").doc(id).delete();
            console.log(`Expense with ID ${id} deleted successfully!`);
            loadExpenses(); // Refresh data after deleting
            showToaster("Expense deleted successfully!");
        } catch (error) {
            console.error(`Error deleting expense with ID ${id}:`, error);
        }
    }
}

// Function to Populate Edit Modal
function openEditModal(row) {
    currentRowToEdit = row;
    const id = row.dataset.id;
    const date = formatDateForInput(new Date(row.cells[1].textContent));
    const name = row.cells[2].textContent;
    const category = row.cells[3].textContent;
    const expense = parseFloat(row.cells[4].textContent);

    currentEditId = id;
    document.getElementById("editId").value = id;
    editDateInput.value = date;
    editNameInput.value = name;
    editCategorySelect.value = category;
    editExpenseInput.value = expense;

    editModal.style.display = "block";
}

// Event listener for saving the edited expense
saveEditButton.addEventListener('click', function() {
    if (currentEditId) {
        const updatedExpense = {
            id: currentEditId,
            date: new Date(editDateInput.value).toISOString().split('T')[0],
            name: editNameInput.value,
            category: editCategorySelect.value,
            expense: parseFloat(editExpenseInput.value)
        };
        updateExpenseInFirebase(updatedExpense);
    }
});

// Event listener for canceling the edit
cancelEditButton.addEventListener('click', function() {
    editModal.style.display = "none";
    currentRowToEdit = null;
    currentEditId = null;
});

// Function to Update Expense Table
function updateExpenseTable() {
    const tbody = document.querySelector('#expenseTable tbody');
    tbody.innerHTML = '';
    expenses.sort((a, b) => {
        // Compare the date properties
        if (a.date < b.date) {
          return -1; // a comes before b
        }
        if (a.date > b.date) {
          return 1;  // a comes after b
        }
        return 0;    // a and b are equal
      });

    expenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.dataset.id = expense.id; // Store ID in the row
        const loggedInUser = localStorage.getItem("loggedInUser");
        row.innerHTML = `
            <td class="small-col">${index + 1}</td>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>${expense.expense.toFixed(2)}</td>

            ${loggedInUser === 'admin' ?
                `<td>
                    <span class="edit-icon" style="cursor: pointer; margin-right: 10px;">&#9998;</span>
                    <span class="delete-icon" style="cursor: pointer; color: red;">&#10006;</span>
                </td>` :
                `<td style="display: none;"></td>` // Hide the action cell for non-admin users
            }
        `;
        tbody.appendChild(row);

        // Attach event listeners to the icons within this row
        const editIcon = row.querySelector('.edit-icon');
        const deleteIcon = row.querySelector('.delete-icon');

        if (editIcon) {
            editIcon.addEventListener('click', function() {
                const row = this.closest('tr');
                openEditModal(row);
            });
        }

        if (deleteIcon) {
            deleteIcon.addEventListener('click', function() {
                const row = this.closest('tr');
                const id = row.dataset.id;
                deleteExpense(id);
            });
        }
    });

    // Update Total Spent
    document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);
}
// Function to Update Category Summary
function updateCategorySummary() {
    const summary = { 'BuildingMaterial': 0, 'ElectricMaterial': 0, 'PlumbingMaterial': 0, 'TilingMaterial': 0, 'PuttyMaterial': 0, 'Mason/Labor': 0, 'TilingLabor': 0, 'PuttyLabor': 0, 'Electrician': 0, 'Gate/Grill/Window': 0, 'Plumber': 0, 'Putty': 0 };
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
    const loggedInUser = localStorage.getItem("loggedInUser");
    tbody.innerHTML = "";
    let filteredExpenses = expenses;

    // Filter by Category
    if (selectedCategory !== "All") {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === selectedCategory);
    }

    // Filter by Date (Only if a date is selected)
    if (selectedDate) {
        filteredExpenses = filteredExpenses.filter(expense => formatDateForFilter(expense.date) === selectedDate);
    }

    // Populate table with filtered data
    filteredExpenses.forEach((expense, index) => {
        const row = document.createElement("tr");
        row.dataset.id = expense.id; // Store ID in the row
        row.innerHTML = `
            <td class="small-col">${index + 1}</td>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>${expense.expense.toFixed(2)}</td>
             ${loggedInUser === 'admin' ?
                `<td>
                    <span class="edit-icon" style="cursor: pointer; margin-right: 10px;">&#9998;</span>
                    <span class="delete-icon" style="cursor: pointer; color: red;">&#10006;</span>
                </td>` :
                `<td style="display: none;"></td>` // Hide the action cell for non-admin users
            }
        `;
        tbody.appendChild(row);

        // Attach event listeners to the icons within this row
        const editIcon = row.querySelector('.edit-icon');
        const deleteIcon = row.querySelector('.delete-icon');

        if (editIcon) {
            editIcon.addEventListener('click', function() {
                const row = this.closest('tr');
                openEditModal(row);
            });
        }

        if (deleteIcon) {
            deleteIcon.addEventListener('click', function() {
                const row = this.closest('tr');
                const id = row.dataset.id;
                deleteExpense(id);
            });
        }
    });

    // Update total spent after filtering
    const totalFilteredSpent = filteredExpenses.reduce((sum, item) => sum + item.expense, 0);
    document.getElementById("totalSpent").textContent = totalFilteredSpent.toFixed(2);
}
// Function to format date as "17 Feb"
function formatDate(dateString) {
const desiredDate = dateString.toString().substring(4, 15); // Extracts " Feb 17 2025"
const formattedDate = desiredDate.trim(); // Removes leading space
return formattedDate;
}
function formatDateForFilter(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}
// Function to format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        userLoggedIn = false;
        window.location.href = "unauthorized.html";
    } else {
        userLoggedIn = true;
        if(user=='admin') {
            showActionColumn=true;
            document.getElementById("actioncolumn");
        }
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
            //hideSpinner();
        }
    } catch (error) {
        debugger;
        console.error("Login error:", error);
        alert("Login failed! Try again.");
        //hideSpinner();
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
// Function to Show Toaster Notification
function showToaster(message) {
    const toaster = document.getElementById("toaster");
    toaster.textContent = message;
    toaster.classList.add("show");
    setTimeout(() => {
        toaster.classList.remove("show");
    }, 3000); // Hide toaster after 3 seconds
}