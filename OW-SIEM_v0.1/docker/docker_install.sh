# Remove any existing Docker and Docker Compose installations
sudo apt-get remove docker docker-engine docker.io containerd runc

# Update package list
sudo apt-get update

# Install required packages
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine, CLI, and containerd
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker

# Verify Docker installation
sudo docker run hello-world

# Remove any previous Docker Compose binary
sudo rm /usr/local/bin/docker-compose

# Download the latest version of Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions to the binary
sudo chmod +x /usr/local/bin/docker-compose

# Verify the installation
docker-compose --version

# Navigate to the deploy directory
cd path/to/siem-tool/deploy

# Build and run the services with Docker Compose
docker-compose up --build

