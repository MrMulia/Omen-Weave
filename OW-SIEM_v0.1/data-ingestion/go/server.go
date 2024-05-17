package main

import (
    "encoding/json"
    "io/ioutil"
    "log"
    "math"
    "net/http"
    "sync"
    "sync/atomic"
    "time"
    "sort"

    "github.com/gorilla/websocket"
    "github.com/rs/cors"
    "github.com/google/gopacket"
    "github.com/google/gopacket/layers"
)

var (
    sourceToOurIP          = make(map[string]int)
    destinationFromOurIP   = make(map[string]int)
    sourceToOurIPEMA       = make(map[string]float64)
    destinationFromOurIPEMA = make(map[string]float64)
    mutex                  sync.Mutex
    ourIP                  = "localhost:3000" // Replace with your server's IP
    alpha                  = 2.0 / (10 + 1)        // Smoothing factor for EMA (N=10 periods)
    currentEntropyBits     int64
    currentEntropyAvailable int32
    frontendConns          = make(map[*websocket.Conn]bool)
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all origins for simplicity
    },
}

func handler(w http.ResponseWriter, r *http.Request) {
    log.Println("Frontend WebSocket connection attempt")
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Upgrade error:", err)
        http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
        return
    }
    defer conn.Close()

    log.Println("Frontend WebSocket connection established")
    frontendConns[conn] = true

    // Keep the connection open
    for {
        if _, _, err := conn.NextReader(); err != nil {
            conn.Close()
            delete(frontendConns, conn)
            break
        }
    }
}

func receiveData(w http.ResponseWriter, r *http.Request) {
    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
        log.Printf("Error reading request body: %v", err)
        http.Error(w, "Unable to read request body", http.StatusBadRequest)
        return
    }
    log.Printf("Received data from Rust.")

    // Deserialize collected packets
    var packets [][]byte
    err = json.Unmarshal(body, &packets)
    if err != nil {
        log.Printf("Error unmarshaling packets: %v", err)
        return
    }

    var srcIPs []byte

    mutex.Lock()
    defer mutex.Unlock()

    for _, packetData := range packets {
        packet := gopacket.NewPacket(packetData, layers.LayerTypeEthernet, gopacket.Default)
        networkLayer := packet.NetworkLayer()
        transportLayer := packet.TransportLayer()
        if networkLayer == nil || transportLayer == nil {
            continue
        }

        srcIP := networkLayer.NetworkFlow().Src().String()
        dstIP := networkLayer.NetworkFlow().Dst().String()
        srcPort := networkLayer.NetworkFlow().Src().String()
        dstPort := networkLayer.NetworkFlow().Dst().String()
        packetSize := len(packetData)

        if dstIP == ourIP {
            sourceToOurIP[srcIP] += packetSize
            updateEMA(sourceToOurIPEMA, srcIP, float64(packetSize))
        }

        if srcIP == ourIP {
            destinationFromOurIP[dstIP] += packetSize
            updateEMA(destinationFromOurIPEMA, dstIP, float64(packetSize))
        }

        // Collect source IPs for entropy calculation
        srcIPs = append(srcIPs, networkLayer.NetworkFlow().Src().Raw()...)

        // Check for critical traffic
        if isCriticalTraffic(srcPort, dstPort) {
            log.Printf("Critical traffic detected from %s to %s on port %s", srcIP, dstIP, srcPort)
        }
    }

    // Calculate and store entropy
    entropy := calculateEntropy(srcIPs)
    log.Printf("Calculated entropy: %f", entropy)
    atomic.StoreInt64(&currentEntropyBits, int64(math.Float64bits(entropy)))
    atomic.StoreInt32(&currentEntropyAvailable, 1)

    sendDataToFrontend()
}

func updateEMA(emaMap map[string]float64, ip string, currentValue float64) {
    previousEMA, exists := emaMap[ip]
    if !exists {
        emaMap[ip] = currentValue
    } else {
        emaMap[ip] = alpha*currentValue + (1-alpha)*previousEMA
    }
}

func sendDataToFrontend() {
    data := map[string]interface{}{
        "sourceToOurIPEMA":         sourceToOurIPEMA,
        "destinationFromOurIPEMA":  destinationFromOurIPEMA,
        "topSourceIPs":             getTopTalkers(sourceToOurIP, 10),
        "topDestinationIPs":        getTopTalkers(destinationFromOurIP, 10),
        "entropy":                  math.Float64frombits(uint64(atomic.LoadInt64(&currentEntropyBits))),
    }

    for conn := range frontendConns {
        err := conn.WriteJSON(data)
        if err != nil {
            log.Printf("Error sending data to frontend: %v", err)
            conn.Close()
            delete(frontendConns, conn)
        }
    }
}

func getTopTalkers(data map[string]int, topN int) []string {
    type kv struct {
        Key   string
        Value int
    }

    var sortedData []kv
    for k, v := range data {
        sortedData = append(sortedData, kv{k, v})
    }

    sort.Slice(sortedData, func(i, j int) bool {
        return sortedData[i].Value > sortedData[j].Value
    })

    var topTalkers []string
    for i := 0; i < topN && i < len(sortedData); i++ {
        topTalkers = append(topTalkers, sortedData[i].Key)
    }

    return topTalkers
}

func isCriticalTraffic(srcPort, dstPort string) bool {
    criticalPorts := []string{"80", "443", "53"} // HTTP, HTTPS, DNS
    for _, port := range criticalPorts {
        if srcPort == port || dstPort == port {
            return true
        }
    }
    return false
}

func handleRustReady(w http.ResponseWriter, r *http.Request) {
    log.Println("Message received: Rust ready.")
    startRustConnection()
}

func startRustConnection() {
    for {
        _, _, err := websocket.DefaultDialer.Dial("ws://rust-program:4000/ws", nil)
        if err == nil {
            log.Println("Successfully connected to Rust WebSocket server")
            return
        }
        log.Printf("Failed to connect to Rust WebSocket server: %v. Retrying in 5 seconds...", err)
        time.Sleep(5 * time.Second)
    }
}

func startServer() {
    mux := http.NewServeMux()
    mux.HandleFunc("/ws", handler)
    mux.HandleFunc("/rust-ready", handleRustReady)
    mux.HandleFunc("/receive-data", receiveData)

    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"*"}, // Allow all origins
        AllowCredentials: true,
    })
    handler := c.Handler(mux)

    go broadcastEntropyAndOWLScore()

    log.Println("Starting server on :5001")
    log.Fatal(http.ListenAndServe("0.0.0.0:5001", handler))
}

func calculateEntropy(data []byte) float64 {
    if len(data) == 0 {
        return -1
    }

    freq := make(map[byte]int)
    for _, b := range data {
        freq[b]++
    }

    total := float64(len(data))
    entropy := 0.0
    for _, count := range freq {
        p := float64(count) / total
        entropy -= p * math.Log2(p)
    }

    maxEntropy := math.Log2(total)
    RU := entropy / maxEntropy

    if total <= 1 {
        return -1
    }

    // Map entropy to a 0-100 scale
    scaledRU := RU * 100

    return scaledRU
}

func broadcastEntropyAndOWLScore() {
    entropyTicker := time.NewTicker(10 * time.Second)
    owlScoreTicker := time.NewTicker(1 * time.Minute)

    for {
        select {
        case <-entropyTicker.C:
            broadcastEntropy()
        case <-owlScoreTicker.C:
            broadcastOWLScore()
        }
    }
}

func broadcastEntropy() {
    if atomic.LoadInt32(&currentEntropyAvailable) == 1 {
        entropyBits := atomic.LoadInt64(&currentEntropyBits)
        entropy := math.Float64frombits(uint64(entropyBits))
        log.Printf("Broadcasting Entropy: %f", entropy)
        response := map[string]interface{}{
            "entropy": entropy,
        }

        for conn := range frontendConns {
            err := conn.WriteJSON(response)
            if err != nil {
                log.Printf("Broadcast error to frontend: %v", err)
                conn.Close()
                delete(frontendConns, conn)
            } else {
                log.Println("Broadcasted entropy data to frontend")
            }
        }
    } else {
        log.Println("No new entropy data to broadcast")
    }
}

func broadcastOWLScore() {
    if atomic.LoadInt32(&currentEntropyAvailable) == 1 {
        owlScoreBits := atomic.LoadInt64(&currentEntropyBits)
        owlScore := math.Float64frombits(uint64(owlScoreBits))
        log.Printf("Broadcasting OWL Score: %f", owlScore)
        response := map[string]interface{}{
            "current_score": owlScore,
        }

        for conn := range frontendConns {
            err := conn.WriteJSON(response)
            if err != nil {
                log.Printf("Broadcast error to frontend: %v", err)
                conn.Close()
                delete(frontendConns, conn)
            } else {
                log.Println("Broadcasted OWL score data to frontend")
            }
        }

        atomic.StoreInt32(&currentEntropyAvailable, 0)
    } else {
        log.Println("No new OWL score data to broadcast")
    }
}