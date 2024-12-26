import torch
import pickle
import torch.nn as nn

from torch_geometric.nn import SAGEConv

###############################################################################
# Custom GraphSAGE Model
###############################################################################
class MovieRecommenderEngine(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, out_channels)
        
        # MLP for final classification from dot product
        self.edge_mlp = nn.Sequential(
            nn.Linear(1, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x, edge_index):
        # Basic two-layer SAGE
        x = self.conv1(x, edge_index)
        x = torch.relu(x)
        x = self.conv2(x, edge_index)
        return x  # node embeddings

    def predict_prob(self, user_emb, movie_emb):
        dot = (user_emb * movie_emb).sum(dim=-1, keepdim=True)
        logit = self.edge_mlp(dot)
        prob = torch.sigmoid(logit).squeeze(-1)
        return prob
    

###############################################################################
# Utility Functions to Save and Load Model
###############################################################################


def save_model(model, user2node, movie2node, unique_movies, feature_dim):
    # 1) Save the model weights
    torch.save(model.state_dict(), "./model/graph_sage_model.pt")

    # 2) Optionally, save your mappings and other metadata

    metadata = {
        "user2node": user2node,
        "movie2node": movie2node,
        "unique_movies": unique_movies,
        "feature_dim": feature_dim,
        "hidden_channels": 32,
        "out_channels": 16,
    }
    with open("./model/recommender_metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)


def load_model():

    # 1) Load any metadata you need
    with open("./model/recommender_metadata.pkl", "rb") as f:
        metadata = pickle.load(f)

    user2node = metadata["user2node"]
    movie2node = metadata["movie2node"]
    unique_movies = metadata["unique_movies"]
    feature_dim = metadata["feature_dim"]
    hidden_channels = metadata["hidden_channels"]
    out_channels = metadata["out_channels"]

    # 2) Re-instantiate the same model class
    model = MovieRecommenderEngine(in_channels=feature_dim, hidden_channels=hidden_channels, out_channels=out_channels)

    model.load_state_dict(torch.load("./model/graph_sage_model.pt"))

    model.eval()  # for inference

    return model, user2node, movie2node, unique_movies, feature_dim
