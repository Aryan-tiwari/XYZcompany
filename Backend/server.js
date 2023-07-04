import express from "express";
import colors from "colors";
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from "./config/db.js";
import authRoute from "./Routes/authRoute.js"
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Dashboard from "./models/dashboardModel.js";
import Budget from "./models/budget.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use("/api/v1/auth", authRoute)
app.use(express.static(join(__dirname, '..', 'Home')));
app.use(express.static(join(__dirname, '..', 'Budgets')));


app.get("/", function (req, res) {
  res.sendFile(join(__dirname, '..', 'index.html'));
});

app.get("/hi", (req, res) => {
  res.send("<h1>Seems like this is working.</h1>")
  console.log("hi url is working.");
})

app.post("/api/dashboard", async (req, res) => {
  try {
    const { email } = req.body;

    const incomeSize = 7;

    const randomIncome = Array.from({ length: incomeSize }, () => Math.floor(Math.random() * 1000));
    const randomExpense = Array.from({ length: incomeSize }, () => Math.floor(Math.random() * 500));

    const income = randomIncome;
    const expenseArr = randomExpense.map((expense, index) => Math.min(expense, income[index]));

    const dashboardData = {
      email: email,
      income: income,
      amountToPay: 500,
      amountToReceive: 500,
      currentBalance: 500,
      overDue: 100,
      expenses: 200,
      followers: 300,
      projects: 400,
      records: 500,
      expenseArr: expenseArr
    };

    const existingDashboard = await Dashboard.findOne({ email });

    if (existingDashboard) {
      const updatedDashboard = await Dashboard.findOneAndUpdate({ email }, dashboardData, { new: true });
      res.json(updatedDashboard);
    } else {
      const newDashboard = new Dashboard(dashboardData);
      const savedDashboard = await newDashboard.save();
      res.json(savedDashboard);
    }
  } catch (error) {
    console.error('Error updating or fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/Budgets/budget.html', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.status(200).json(budgets);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/budget-submit-form", async (req, res) => {
  try {
    const { name, email, period, description, amount, expenses } = req.body;

    // Check if all required fields are present
    if (!name || !email || !period || !amount || !description || !expenses) {
      const errorMessage = "All fields are required";
      console.error(errorMessage);
      return;
    }

    // Find existing budget document based on email
    let budget = await Budget.findOne({ email });

    if (budget) {
      // Update existing budget document
      budget.name = name;
      budget.period = period;
      budget.description = description;
      budget.amount = amount;
      budget.expense = expenses;
    } else {
      // Create new budget document
      budget = new Budget({
        name,
        email,
        period,
        description,
        amount,
        expense: expenses,
      });
    }

    // Save the budget document to the database
    await budget.save();

  } catch (error) {
    console.error(error);
    console.log("Form submission failed");
    console.log("Internal server error");
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

app.delete("/api/v1/budgets/:id", async (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // Delete the budget document from the database
    await Budget.findByIdAndDelete(budgetId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, function () {
  console.log(`Server started ${process.env.mode} on port ${PORT}`);
});
