import torch
from recommender_model import load_model
from movie_dataset import load_data

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

@torch.no_grad()
def compute_all_embeddings(data, model, device):
    model.eval()
    data = data.to(device)
    x_emb = model(data.x, data.edge_index)
    return x_emb.cpu()


class RecommenderEngine:
    def __init__(self) -> None:
        self.model, self.user2node, self.movie2node, self.unique_movies, self.feature_dim = load_model()
        self.model.to(device)

        self.data, self.user2node, self.movie2node, self.unique_movies, self.unique_users, self.feature_dim = load_data()
        self.data = self.data.to(device)  

        self.full_x_emb = compute_all_embeddings(self.data, self.model, device)


    @torch.no_grad()
    def recommend_movies_for_user(self, known_movie_ids, topK=5):
        self.model.eval()
        user_idx = self.user2node[1]
        user_emb = self.full_x_emb[user_idx].unsqueeze(0)
        
        predictions = []
        for mid in self.unique_movies:
            if mid in known_movie_ids:
                continue
            movie_idx = self.movie2node[mid]
            movie_emb = self.full_x_emb[movie_idx].unsqueeze(0)
            # Dot product => probability
            prob = self.model.predict_prob(user_emb, movie_emb).item()
            predictions.append((mid, prob))
        
        # Sort descending
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:topK]