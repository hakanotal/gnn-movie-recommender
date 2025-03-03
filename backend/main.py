from pydantic import BaseModel
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from recommender_inference import RecommenderEngine
from database import MovieDB, get_db

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://gnn-movie-recommender.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

###############################################################################
# Pydantic Models (Schemas) for Responses
###############################################################################
class MovieRead(BaseModel):
    id: int
    title: str
    year: str
    genres: str
    imdb_id: Optional[str] = None
    tmdb_id: Optional[int] = None
    
    class Config:
        orm_mode = True

class MovieListResponse(BaseModel):
    movies: List[MovieRead]
    total: int
    pages: int

class RecommendationRequest(BaseModel):
    known_movies: List[int] = []
    top_k: int = 5

###############################################################################
# List Movies (GET /movies)
###############################################################################
@app.get("/movies", response_model=MovieListResponse)
def list_movies(
    skip: int = 0,
    limit: int = 20,
    year: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Return a paginated list of movies from the DB,
    with optional year filter and title search
    """
    query = db.query(MovieDB)
    
    if year:
        query = query.filter(MovieDB.year == year)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(MovieDB.title.ilike(search_term))
    
    total = query.count()
    movies = query.offset(skip).limit(limit).all()
    
    movie_list = [
        MovieRead(
            id=movie.id,
            title=movie.title,
            year=movie.year,
            genres=movie.genres,
            imdb_id=movie.imdb_id,
            tmdb_id=movie.tmdb_id
        ) 
        for movie in movies
    ]
    
    return MovieListResponse(
        movies=movie_list,
        total=total,
        pages=(total + limit - 1) // limit
    )

###############################################################################
# Retrieve a Single Movie (GET /movies/{movie_id})
###############################################################################
@app.get("/movies/{movie_id}", response_model=MovieRead)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    """
    Return a single movie by its internal 'movieId'.
    """
    movie = db.query(MovieDB).filter(MovieDB.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found.")
    return movie

###############################################################################
# Retrieve Movie Poster (BLOB) (GET /movies/{movie_id}/poster)
###############################################################################
@app.get("/movies/{movie_id}/poster")
def get_movie_poster(movie_id: int, db: Session = Depends(get_db)):
    """
    Returns the poster image (if available) for the given movie ID.
    Since we stored it as a BLOB, we fetch it from DB and return as image/jpeg.
    """
    movie = db.query(MovieDB).filter(MovieDB.id == movie_id).first()
    if not movie or not movie.poster_blob:
        # raise HTTPException(status_code=404, detail="No poster available for this movie.")
        default_poster = open("./posters/default.jpg", "rb").read()
        return Response(content=default_poster, media_type="image/jpeg")
    
    return Response(content=movie.poster_blob, media_type="image/jpeg")


###############################################################################
# Filter Movies by Genre (Optional)
###############################################################################
@app.get("/movies/genre/{genre}", response_model=List[MovieRead])
def list_movies_by_genre(
    genre: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """
    Filter movies that contain the given genre in the 'genres' string.
    For example if genres="Adventure|Children|Fantasy",
    a GET /movies/genre/Fantasy might match.
    """
    query_str = f"%{genre}%"
    results = db.query(MovieDB).filter(MovieDB.genres.ilike(query_str))\
        .offset(skip).limit(limit).all()
    return results


###############################################################################
# Recommendation Endpoint
###############################################################################
@app.post("/recommend")
def get_recommendations(req: RecommendationRequest):
    """
    Example request body:
    {
      "known_movies": [1, 50, 145],
      "top_k": 5
    }
    """
    # Generate top-K recommendations
    # engine = RecommenderEngine()
    # top_recs = engine.recommend_movies_for_user(
    #     known_movie_ids=req.known_movies,
    #     topK=req.top_k
    # )
    top_recs = [(100, 0.97), (101, 0.96), (102, 0.94), (103, 0.91), (104, 0.87)]

    # Format as JSON-friendly output
    results = []
    for (mid, prob) in top_recs:
        try:
            results.append({"movieId": int(mid), "score": round(prob, 4)})
        except:
            print(f"Movie ID {mid} not found in database.")
            
    return {"recommendations": results}


###############################################################################
# Root Endpoint
###############################################################################
@app.get("/")
def root():
    return {"message": "Movie Recommender API is up!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)