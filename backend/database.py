from sqlalchemy import create_engine, Column, Integer, String, LargeBinary
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./movies.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
Base.metadata.create_all(bind=engine)

class MovieDB(Base):
    __tablename__ = "movies"
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    year = Column(String)
    genres = Column(String)
    imdb_id = Column(String)
    tmdb_id = Column(Integer)
    poster_blob = Column(LargeBinary, nullable=True)


# A helper function for dependency injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()