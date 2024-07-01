package common

import (
	"log"
	"math"
	"net"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	SourceToOurIP           = make(map[string]int)
	DestinationFromOurIP    = make(map[string]int)
	SourceToOurIPEMA        = make(map[string]float64)
	DestinationFromOurIPEMA = make(map[string]float64)
	FrontendConns           = make(map[*websocket.Conn]bool)
	Alpha                   = 2.0 / (10 + 1)
	Mutex                   sync.Mutex
	CurrentEntropyBits      int64
	CurrentEntropyAvailable int32
	OurIP                   string
)

// Updated struct to hold the received data
type ReceivedData struct {
	NetworkPackets [][]byte       `json:"network_packets"`
	CpuUsage       float64        `json:"cpu_usage"`
	MemoryUsage    float64        `json:"memory_usage"`
	UniqueSrcIps   int            `json:"unique_src_ips"`
	UniqueDstIps   int            `json:"unique_dst_ips"`
	NumHosts       int            `json:"num_hosts"`
	ImportantPorts map[uint16]int `json:"important_ports"`
}

func UpdateEMA(emaMap map[string]float64, ip string, currentValue float64) {
	previousEMA, exists := emaMap[ip]
	if !exists {
		emaMap[ip] = currentValue
	} else {
		emaMap[ip] = Alpha*currentValue + (1-Alpha)*previousEMA
	}
}

func BroadcastData(data map[string]interface{}) {
	for conn := range FrontendConns {
		err := conn.WriteJSON(data)
		if err != nil {
			conn.Close()
			delete(FrontendConns, conn)
		}
	}
}

func CalculateEntropy(data []byte) float64 {
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

	scaledRU := RU * 100

	return scaledRU
}

func InitLocalIP() {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		log.Fatalf("Error getting local IP address: %v", err)
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				OurIP = ipnet.IP.String()
				return
			}
		}
	}
	log.Fatal("Could not determine local IP address")
}

func StartRustConnection() {
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
