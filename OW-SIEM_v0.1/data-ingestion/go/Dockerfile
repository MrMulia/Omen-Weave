FROM golang:1.20

# Install libpcap-dev
RUN apt-get update && apt-get install -y libpcap-dev

WORKDIR /usr/src/app

COPY . .

RUN go mod tidy
RUN go build -o main .

EXPOSE 5001

CMD ["./main"]
