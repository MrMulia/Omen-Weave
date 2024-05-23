package server

import (
    "log"
    "net/http"

    "github.com/rs/cors"

    "omenweave-siem/handlers"
)

func StartServer() {
    mux := http.NewServeMux()
    mux.HandleFunc("/ws", handlers.WSHandler)
    mux.HandleFunc("/rust-ready", handlers.RustReadyHandler)
    mux.HandleFunc("/receive-data", handlers.ReceiveDataHandler)

    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"*"}, // Allow all origins
        AllowCredentials: true,
    })
    handler := c.Handler(mux)

    log.Println("Starting Go Server (:5001)")
    log.Fatal(http.ListenAndServe("0.0.0.0:5001", handler))
}
