git clone -b ice-cloud-dev https://github.com/BunnyBoss/JobAIder.git
cd JobAIder/


apt update
apt-get install -y python3-pip python3-venv
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs


HOST_PREFIX=$(hostname | cut -d'-' -f1-3)
echo "NEXT_PUBLIC_API_BASE=https://${HOST_PREFIX}-8000.icecloud.in" > .env.icecloud.example
echo "ALLOWED_ORIGINS=https://${HOST_PREFIX}-3000.icecloud.in" >> .env.icecloud.example

bash start_all.sh


tail -f backend.log frontend.log