#!/bin/sh

while ! nc -z rust-program 4000; do
    echo "Waiting for Rust service to be ready..."
    sleep 5
done

echo "Rust service is ready. Starting Go program..."
exec "$@"
