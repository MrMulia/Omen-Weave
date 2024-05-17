FROM ubuntu:20.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpcap-dev \
    pkg-config \
    libssl-dev \
    tzdata

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /usr/src/app

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .
RUN cargo build --release

FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libpcap-dev \
    libc6 \
    libssl-dev \
    tzdata

COPY --from=builder /usr/src/app/target/release/rust-network-traffic /usr/local/bin/rust-network-traffic
CMD ["rust-network-traffic"]
