FROM mongo:7

# Copy keyfile generation script
COPY ./scripts/generate-keyfile.sh /docker-entrypoint-initdb.d/generate-keyfile.sh

RUN chmod +x /docker-entrypoint-initdb.d/generate-keyfile.sh \
    # Generate keyfile inside the image at build time
    && openssl rand -base64 756 > /etc/mongo-keyfile \
    && chmod 400 /etc/mongo-keyfile \
    && chown mongodb:mongodb /etc/mongo-keyfile