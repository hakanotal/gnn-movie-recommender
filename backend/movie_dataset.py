import torch
import numpy as np
import pandas as pd

from torch_geometric.data import Data

def load_data():
    ###############################################################################
    # 1) Load CSVs (Same as Before)
    ###############################################################################

    df_movies = pd.read_csv('./movie_lens_db/movies.csv')
    genres = df_movies['genres'].str.split('|').apply(pd.Series).stack().unique()
    df_genres = pd.DataFrame(genres, columns=['genre'])
    df_genres['genreId'] = df_genres.index

    df_movie_genre = df_movies[['movieId', 'genres']].copy()
    df_movie_genre['genres'] = df_movie_genre['genres'].str.split('|').apply(
        lambda x: [df_genres[df_genres['genre'] == i].genreId.values[0] for i in x]
    )
    df_movie_genre = df_movie_genre.explode('genres')
    df_movie_genre.rename(columns={'genres': 'genreId'}, inplace=True)
    df_movie_genre.reset_index(drop=True, inplace=True)
    df_movies.drop(columns=['genres'], inplace=True)

    df_ratings = pd.read_csv('./movie_lens_db/ratings.csv')
    df_ratings['ratingId'] = df_ratings.index
    df_ratings['timestamp'] = pd.to_datetime(
        df_ratings['timestamp'], unit='s'
    ).dt.strftime('%Y-%m-%d').astype('datetime64[s]')
    df_ratings.rename(columns={'timestamp': 'date'}, inplace=True)
    df_users = pd.DataFrame(df_ratings['userId'].unique(), columns=['userId'])

    ###############################################################################
    # 2) Label Ratings (>=3 => 1, <3 => 0)
    ###############################################################################
    df_ratings_bin = df_ratings.copy()
    df_ratings_bin['label'] = (df_ratings_bin['rating'] >= 3).astype(int)

    ###############################################################################
    # 3) Map Users & Movies to Node Indices
    ###############################################################################
    unique_users = df_users['userId'].unique()
    unique_movies = df_movies['movieId'].unique()

    num_users = len(unique_users)
    num_movies = len(unique_movies)

    user2node = {uid: i for i, uid in enumerate(unique_users)}
    movie2node = {mid: (num_users + i) for i, mid in enumerate(unique_movies)}

    total_nodes = num_users + num_movies

    ###############################################################################
    # 4) Build Edge Lists (Pos/Neg) & Edge Labels
    ###############################################################################
    edge_user = []
    edge_movie = []
    edge_label = []

    for row in df_ratings_bin.itertuples(index=False):
        u_node = user2node[row.userId]
        m_node = movie2node[row.movieId]
        edge_user.append(u_node)
        edge_movie.append(m_node)
        edge_label.append(row.label)

    edge_user = torch.tensor(edge_user, dtype=torch.long)
    edge_movie = torch.tensor(edge_movie, dtype=torch.long)
    edge_label = torch.tensor(edge_label, dtype=torch.float)

    # Final edge_index => shape [2, E]
    edge_index = torch.stack([edge_user, edge_movie], dim=0)

    ###############################################################################
    # 5) Build Node Features (Movie Genres + Random User Feats)
    ###############################################################################
    n_genres = df_genres.shape[0]  # e.g. number of unique genres
    movie_genre_mat = np.zeros((num_movies, n_genres), dtype=np.float32)

    for row in df_movie_genre.itertuples(index=False):
        mid = row.movieId
        gid = row.genreId
        movie_idx = movie2node[mid] - num_users
        movie_genre_mat[movie_idx, gid] = 1.0

    user_extra_dim = 0  # random user features
    movie_extra_dim = 8

    feature_dim = n_genres + max(user_extra_dim, movie_extra_dim)
    X = np.zeros((total_nodes, feature_dim), dtype=np.float32)

    # Fill user rows with random features in the last `user_extra_dim` columns
    for i, uid in enumerate(unique_users):
        random_feat = np.random.randn(user_extra_dim).astype(np.float32)
        X[i, n_genres:(n_genres + user_extra_dim)] = random_feat

    # Fill movie rows with multi-hot genre in the first `n_genres` columns
    for j, mid in enumerate(unique_movies):
        node_index = num_users + j
        X[node_index, :n_genres] = movie_genre_mat[j]

    x = torch.from_numpy(X).float()

    ###############################################################################
    # 6) Create a PyG Data object
    ###############################################################################
    data = Data(x=x, edge_index=edge_index)
    data.edge_label = edge_label

    return data, user2node, movie2node, unique_movies, unique_users, feature_dim