const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Query = require('./models/Query');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://test:test@cluster0.tdke3bb.mongodb.net/Appdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  aadharNo: String,
  phoneNo: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Ticket Schema
const ticketSchema = new mongoose.Schema({
  description: String,
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
});

const Ticket = mongoose.model('Ticket', ticketSchema);

const adminUser = {
  name: "Admin",
  email: "26anugyaverma@gmail.com",
  password: "adminpassword",
  role: "admin",
};


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user is the admin
    if (email === adminUser.email && password === adminUser.password) {
      return res.status(200).send('Login successful');
    }

    // If not the admin, proceed with regular user login logic
    const user = await User.findOne({ email, password });
    if (user) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Incorrect email or password');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Incorrect email or password');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Routes

// Route to update a query
app.put("/queries/:id", async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      { description },
      { new: true }
    );
    res.json(updatedQuery);
  } catch (error) {
    console.error("Error updating query", error);
    res.status(500).json({ error: "Error updating query" });
  }
});

// Route to delete a query
app.delete('/queries/:queryId', async (req, res) => {
  try {
    const { queryId } = req.params;

    // Check if the query exists
    const query = await Query.findById(queryId);
    if (!query) {
      return res.status(404).send('Query not found');
    }

    // Check if the query is closed
    if (query.status === 'Closed') {
      // Delete the query
      await Query.findByIdAndDelete(queryId);
      res.status(200).send('Query deleted successfully');
    } else {
      res.status(400).send('Cannot delete an open query');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.post('/signup', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).send('User created successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});



app.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/tickets', async (req, res) => {
  try {
    const { description, status } = req.body;
    const newTicket = new Ticket({ description, status });
    await newTicket.save();
    res.status(201).send('Ticket created successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updatedTicket) {
      return res.status(404).send('Ticket not found');
    }
    res.status(200).send('Ticket updated successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get all queries
app.get('/queries', async (req, res) => {
  try {
    const queries = await Query.find();
    res.json(queries);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to post a new query
app.post('/queries', async (req, res) => {
  try {
    const { description } = req.body;
    const newQuery = new Query({ description });
    const savedQuery = await newQuery.save();
    res.status(201).json(savedQuery);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to post a solution to a query
app.post('/queries/:queryId/solutions', async (req, res) => {
  try {
    const { queryId } = req.params;
    const { solution } = req.body;

    const query = await Query.findById(queryId);
    if (!query) {
      return res.status(404).send('Query not found');
    }

    query.solution = solution;
    query.status = 'Closed'; // Update the status to 'Closed' when a solution is provided
    await query.save();

    res.status(200).send('Solution added');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});