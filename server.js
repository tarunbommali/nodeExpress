const express = require("express");
const path = require("path");
const cors = require('cors');
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "goodreads.db");

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/books/", async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT
        *
      FROM
        book
      ORDER BY
        book_id;`;
    const booksArray = await db.all(getBooksQuery);
    response.send(booksArray);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    response.status(500).send({ error: error.message });
  }
});

// Define a catch-all route to handle 404 errors
app.use((req, res, next) => {
  res.status(404).send("Whoops! We've got nothing under this link.");
});
