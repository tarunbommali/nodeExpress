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

    // Use environment variable for port, default to 3000
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

// GET method to fetch all books
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

// POST method to add a new book
app.post("/book/", async (request, response) => {
  const { title, author, genre, published_year } = request.body;

  // Validate input
  if (!title || !author || !genre || !published_year) {
    return response.status(400).send({ error: "All fields are required" });
  }

  const addBookQuery = `
    INSERT INTO
      book (title, author, genre, published_year)
    VALUES
      ('${title}', '${author}', '${genre}', ${published_year});`;

  try {
    const dbResponse = await db.run(addBookQuery);
    const bookId = dbResponse.lastID;
    response.status(201).send({ bookId: bookId });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    response.status(500).send({ error: error.message });
  }
});

// POST method to add multiple new books
app.post("/books/", async (request, response) => {
  const books = request.body; // Expecting an array of books

  if (!Array.isArray(books)) {
    return response.status(400).send({ error: "Request body should be an array of books" });
  }

  try {
    const insertPromises = books.map(book => {
      const { title, author, genre, published_year } = book;

      // Validate input
      if (!title || !author || !genre || !published_year) {
        throw new Error("All fields are required for each book");
      }

      const addBookQuery = `
        INSERT INTO
          book (title, author, genre, published_year)
        VALUES
          ('${title}', '${author}', '${genre}', ${published_year});`;
      return db.run(addBookQuery);
    });

    await Promise.all(insertPromises);
    response.status(201).send({ message: "Books added successfully" });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    response.status(500).send({ error: error.message });
  }
});
