import torch
from recommender_model import load_model
from movie_dataset import load_data

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model, user2node, movie2node, unique_movies, feature_dim = load_model()
model.to(device)

data, user2node, movie2node, unique_movies, unique_users, feature_dim = load_data()
data = data.to(device)  


@torch.no_grad()
def compute_all_embeddings(data, model, device):
    model.eval()
    data = data.to(device)
    x_emb = model(data.x, data.edge_index)
    return x_emb.cpu()

full_x_emb = compute_all_embeddings(data, model, device)


@torch.no_grad()
def recommend_movies_for_user(known_movie_ids, topK=5):
    model.eval()
    user_idx = user2node[1]
    user_emb = full_x_emb[user_idx].unsqueeze(0)
    
    predictions = []
    for mid in unique_movies:
        if mid in known_movie_ids:
            continue
        movie_idx = movie2node[mid]
        movie_emb = full_x_emb[movie_idx].unsqueeze(0)
        # Dot product => probability
        prob = model.predict_prob(user_emb, movie_emb).item()
        predictions.append((mid, prob))
    
    # Sort descending
    predictions.sort(key=lambda x: x[1], reverse=True)
    return predictions[:topK]