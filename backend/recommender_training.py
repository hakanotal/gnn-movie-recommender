import torch
import numpy as np
import torch.nn as nn
import torch.optim as optim
from torch_geometric.loader import LinkNeighborLoader

from movie_dataset import load_data
from recommender_model import MovieRecommenderEngine


###############################################################################
# 7) Train/Val Split (Edge-Level)
###############################################################################

data, user2node, movie2node, unique_movies, unique_users, feature_dim = load_data()

num_edges = data.edge_index.shape[1]
indices = np.arange(num_edges)
np.random.shuffle(indices)

train_size = int(0.8 * num_edges)
train_idx = torch.tensor(indices[:train_size], dtype=torch.long)
val_idx = torch.tensor(indices[train_size:], dtype=torch.long)


###############################################################################
# 9) Use LinkNeighborLoader for Mini-Batch Training
###############################################################################
# We'll build two loaders: one for training edges, one for validation edges.
# Each step, it samples a batch of edges plus the neighbors needed in a subgraph.

from torch_geometric.loader import LinkNeighborLoader

# Training loader
train_loader = LinkNeighborLoader(
    data,
    num_neighbors=[10, 10],  # sample up to 10 neighbors at 1-hop and 10 at 2-hop
    batch_size=1024,
    #edge_label_index=(data.edge_index[0, train_idx], data.edge_index[1, train_idx]),
    edge_label_index = data.edge_index[:, train_idx],
    edge_label=data.edge_label[train_idx],
    shuffle=True
)

# Validation loader
val_loader = LinkNeighborLoader(
    data,
    num_neighbors=[10, 10],
    batch_size=1024,
    #edge_label_index=(data.edge_index[0, val_idx], data.edge_index[1, val_idx]),
    edge_label_index = data.edge_index[:, val_idx],
    edge_label=data.edge_label[val_idx],
    shuffle=False
)

###############################################################################
# 10) Initialize Model & Optimizer
###############################################################################
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model = MovieRecommenderEngine(
    in_channels=feature_dim,
    hidden_channels=32,
    out_channels=16
).to(device)

criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=1e-2)

###############################################################################
# 11) Training & Evaluation (Mini-Batched)
###############################################################################
def train_epoch(loader):
    model.train()
    total_loss = 0
    total_edges = 0

    for batch_data in loader:
        # batch_data is a subgraph + the batch of edges
        # Move everything to device
        batch_data = batch_data.to(device)
        
        # Forward pass on the subgraph
        x_emb = model(batch_data.x, batch_data.edge_index)
        
        # The loader automatically renumbers nodes in the subgraph,
        # so batch_data.edge_label_index references subgraph node indices.
        user_emb = x_emb[batch_data.edge_label_index[0]]
        movie_emb = x_emb[batch_data.edge_label_index[1]]
        
        pred = model.predict_prob(user_emb, movie_emb)
        true = batch_data.edge_label  # shape [batch_size]
        
        loss = criterion(pred, true)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        # The batch size for link-level tasks = number of edges in this batch
        batch_size = batch_data.edge_label.size(0)
        total_loss += float(loss) * batch_size
        total_edges += batch_size

    # Return average loss across *all* edges in the epoch
    return total_loss / total_edges

@torch.no_grad()
def eval_epoch(loader):
    model.eval()
    total_loss = 0
    total_edges = 0
    correct = 0

    for batch_data in loader:
        batch_data = batch_data.to(device)

        x_emb = model(batch_data.x, batch_data.edge_index)

        user_emb = x_emb[batch_data.edge_label_index[0]]
        movie_emb = x_emb[batch_data.edge_label_index[1]]
        pred = model.predict_prob(user_emb, movie_emb)

        true = batch_data.edge_label
        loss = criterion(pred, true)

        batch_size = true.size(0)
        total_loss += float(loss) * batch_size
        total_edges += batch_size

        pred_class = (pred > 0.5).float()
        correct += (pred_class == true).sum().item()

    avg_loss = total_loss / total_edges
    accuracy = correct / total_edges
    return avg_loss, accuracy

###############################################################################
# 12) Run Training
###############################################################################
num_epochs = 10
for epoch in range(1, num_epochs + 1):
    train_loss = train_epoch(train_loader)
    val_loss, val_acc = eval_epoch(val_loader)
    print(f"Epoch {epoch:02d} | "
          f"Train Loss: {train_loss:.4f} | "
          f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
