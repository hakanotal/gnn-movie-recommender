import sqlite3
import psycopg2
import os
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL")
print(DATABASE_URL)

# SQLite connection
sqlite_conn = sqlite3.connect('./movies.db')
sqlite_cursor = sqlite_conn.cursor()

# PostgreSQL connection
pg_conn = psycopg2.connect(DATABASE_URL)
pg_cursor = pg_conn.cursor()

# Create table in PostgreSQL
pg_cursor.execute('''
CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year VARCHAR(10),
    genres VARCHAR(255),
    imdb_id VARCHAR(20),
    tmdb_id INTEGER
);
''')

# Get data from SQLite
sqlite_cursor.execute("SELECT id, title, year, genres, imdb_id, tmdb_id FROM movies")
movies = sqlite_cursor.fetchall()

# Insert data into PostgreSQL
for movie in tqdm(movies):
    pg_cursor.execute(
        "INSERT INTO movies (id, title, year, genres, imdb_id, tmdb_id) VALUES (%s, %s, %s, %s, %s, %s)",
        movie
    )

# Commit and close connections
pg_conn.commit()
sqlite_conn.close()
pg_conn.close()

print(f"Migration complete. {len(movies)} movies transferred.") 